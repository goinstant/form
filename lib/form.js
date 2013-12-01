/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileoverview
 * The Form module:
 *
 * - Initializes a form with existing state
 * - Captures user state changes to form elements.
 * - Receives other users' state changes and alters the state here.
 *
 * # Element Identification
 *
 * Elements are identified for storage/capturing/receiving based on several
 * properties.
 *
 * - tag name
 * - type
 * - name
 * - index (treating their name as an array)
 *
 * This information is used to find the element on either side, and to store
 * the element's value as a unique key.
 *
 * For instance, if we had the following HTML:
 *
 * <form>
 *   <input type="text" name="example_name" />
 *
 * That would create the following key:
 *
 * goinstant-component-form/input/text/example_name/0
 */

/* Export the module */
module.exports = Form;

/** Module dependencies */
var goinstant = window.goinstant;
var _ = require('lodash');
var Emitter = require('emitter');
var delegate = require('delegate');
var closest = require('closest');
var binder = require('binder');
var async = require('async');

window.closest = closest;

var UserCache = require('usercache');

var nameIndex = require('./name_index');
var elementNames = require('./element_names');
var elementValue = require('./element_value');
var View = require('./view');

/** Constants */
/**
 * All properties of this component will be nested underneath this property.
 * This allows us to track the use of the form component and namespaces our
 * property changes from others a developer may have on the key they give us.
 */
var KEY_NAMESPACE_NAME = 'goinstant-widgets-form';

var TAG_NAMES = require('./tag_names');

var NO_CAPTURE_TYPES = [
  'button',
  'submit',
  'image',
  'reset',
  'file'
];

var DATA_GOINSTANT_ID = 'data-goinstant-id';
var DATA_GOINSTANT_CLICK = 'gi-click';

/** Valid Parameters */
var VALID_OPTIONS = ['key', 'el', 'room', 'include', 'displayTimer', 'ui'];
var VALID_EVENTS = ['error'];
var DEFAULT_OPTIONS = {
  displayTimer: 1000,
  ui: true
};

/** Form Widget States */
var STATES = {
  NEW: 'new',
  INITIALIZING: 'initializing',
  INITIALIZED: 'initialized',
  DESTROYING: 'destroying',
  DESTROYED: 'destroyed',
  FAILED_DESTROY: 'failed_destroy',
};

var MAX_NAME_LENGTH = 128;


/** Public Methods */

/**
 * @constructor
 */
function Form(opts) {
  if (!_.isPlainObject(opts)) {
    throw new Error('Form: options must be an object.');
  }

  var invalidOpts = _.difference(_.keys(opts), VALID_OPTIONS);
  if (invalidOpts.length > 0) {
    var errMsg = 'Form: Invalid options passed (' + invalidOpts.join(', ') +
                                                ')';
    throw new Error(errMsg);
  }

  opts = _.defaults(opts, DEFAULT_OPTIONS);

  if (!opts.key instanceof goinstant.Key) {
    throw new Error('Form: options.key must be a Key object.');
  }

  if (!_.isElement(opts.el) || opts.el.tagName != TAG_NAMES.FORM) {
    throw new Error('Form: options.el must be a Form element');
  }

  if (_.has(opts, 'include')) {
    if (!_.isArray(opts.include)) {
      throw new Error('Form: options.include must be an array, if defined');
    }

    if (!_.all(opts.include, _.isString)) {
      throw new Error('Form: options.include must only contain strings');
    }
  }

  if (!_.isNumber(opts.displayTimer)) {
    throw new Error('Form: displayTimer must be a number');
  }

  if (!_.isBoolean(opts.ui)) {
    throw new Error('Form: ui flag must be a boolean');
  }

  this._bindings = [
    { tag: TAG_NAMES.INPUT, event: 'keyup' },
    { tag: TAG_NAMES.INPUT, event: 'change' },
    { tag: TAG_NAMES.INPUT, event: 'click' },

    { tag: TAG_NAMES.TEXTAREA, event: 'keyup' },
    { tag: TAG_NAMES.TEXTAREA, event: 'click' },

    { tag: TAG_NAMES.SELECT, event: 'change' }
  ];

  _.bindAll(
    this,
    '_capture',
    '_receive',
    '_bindPlatform',
    '_unbindPlatform',
    '_handleUserChange',
    '_reset',
    '_receiveReset'
  );

  this.key = opts.key.key(KEY_NAMESPACE_NAME);
  this.form = opts.el;
  this.include = opts.include;

  this.local = true;
  this.state = STATES.NEW;

  this._emitter = new Emitter();
  this._usercache = new UserCache(opts.room);

  this._clickExists = window.goinstant.widgets.ClickIndicator;

  if (opts.ui) {
    this._view = new View(opts.displayTimer);
  }
}

Form.NAMESPACE = KEY_NAMESPACE_NAME;

Form.prototype.initialize = function(cb) {
  var self = this;

  if (!cb || !_.isFunction(cb)) {
    throw new Error('Form#initialize: callback must be a function');
  }

  if (self.state != STATES.NEW) {
    return cb(new Error('Form#initialize: You can only initialize once.'));
  }

  self.state = STATES.INITIALIZING;

  if (this._view) {
    this._view.initialize();
  }

  this._bindPlatform();

  var tasks = {
    usercache: _.bind(this._usercache.initialize, this._usercache),
    elMap: _.bind(this.key.get, this.key)
  };

  async.series(tasks, function(err, results) {
    if (err) {
      // TODO: Should really do a #destroy here because we now might have
      // some bindings but not others.
      self.state = STATES.NEW;
      return cb(err);
    }

    self._usercache.on('change', self._handleUserChange);

    var elMap = results.elMap[0]; // Key value is the first parameter.

    _.each(elMap, function(types, tagName) {
      _.each(types, function(names, type) {
        _.each(names, function(indices, name) {
          _.each(indices, function(value, index) {
            var identity = {
              name: elementNames.unescape(name),
              index: index,
              type: type,
              tagName: tagName
            };

            self._setEl(identity, value);
          });
        });
      });
    });

    self._bindDOM();

    self.state = STATES.INITIALIZED;

    return cb();
  });
};

Form.prototype.destroy = function(cb) {
  var self = this;
  if (!cb || !_.isFunction(cb)) {
    throw new Error('Form#destroy: callback must be a function');
  }

  if (self.state != STATES.INITIALIZED && self.state != STATES.FAILED_DESTROY) {
    var errMsg = 'Form#destroy: Form must be initialized and can only be ' +
                 'destroyed once';

    return cb(new Error(errMsg));
  }

  self.state = STATES.DESTROYING;

  if (this._view) {
    this._view.destroy();
  }

  this._unbindPlatform();

  this._usercache.destroy(function() {
    self._unbindDOM();

    self.state = STATES.DESTROYED;

    return cb();
  });
};

Form.prototype.on = function(evt, listener) {
  if (!_.include(VALID_EVENTS, evt)) {
    throw new Error('Form#on: event name must be one of: ' +
                    VALID_EVENTS.join(', '));
  }

  this._emitter.on(evt, listener);
};

Form.prototype.off = function(evt, listener) {
  if (!_.include(VALID_EVENTS, evt)) {
    throw new Error('Form#off: event name must be one of: ' +
                    VALID_EVENTS.join(', '));
  }

  this._emitter.off(evt, listener);
};

/** Private methods */
Form.prototype._emitOrThrow = function(err) {
  if (this._emitter.hasListeners('error')) {
    this._emitter.emit('error', err);

  } else {
    throw err;
  }
};

Form.prototype._bindDOM = function() {
  var form = this.form;
  var self = this;

  _.each(this._bindings, function(binding) {
    binding.cb = delegate.bind(form, binding.tag, binding.event, self._capture);
  });

  binder.on(form, 'reset', this._reset);
};

Form.prototype._unbindDOM = function() {
  var form = this.form;

  // Delegate unbinding has a different signature from binding, see the
  // component/delegate docs.
  // https://github.com/component/delegate
  _.each(this._bindings, function(binding) {
    delegate.unbind(form, binding.event, binding.cb);
  });

  binder.off(form, 'reset', this._reset);
};

Form.prototype._bindPlatform = function() {
  var opts = {
    listener: this._receive,
    bubble: true
  };

  this.key.on('set', opts);
  this.key.on('remove', this._receiveReset);
};

Form.prototype._unbindPlatform = function() {
  this.key.off('set', this._receive);
  this.key.off('remove', null);
};

function getElement(evt) {
  if (evt && evt.target) {
    return evt.target;

  } else {
    return window.event.srcElement;
  }
}

Form.prototype._capture = function(evt, cb) {
  var self = this;

  var el = getElement(evt);

  if (el.tagName == TAG_NAMES.INPUT &&
      _.contains(NO_CAPTURE_TYPES, el.type)) {
    // Some inputs don't make sense to sync, such as file and submit.
    // These should just be ignored by the Form widget.
    return cb && cb();
  }

  if (el.type === "radio" && !el.checked) {
    // Ignore interactions with a radio button that has not been checked.
    return cb && cb();
  }

  var elName = el.name;

  if (self.include && !_.contains(self.include, elName)) {
    return cb && cb();
  }

  var errMsg;
  if (!elName) {
    errMsg = 'Form: <' + el.tagName + '> without name inside of form';
    self._emitOrThrow(new Error(errMsg));
    return;
  }

  var escapedElName = elementNames.escape(elName);

  if (escapedElName.length > MAX_NAME_LENGTH) {
    errMsg = 'Form: <' + el.tagName + '> after escaping has a name longer ' +
      'than ' + MAX_NAME_LENGTH + ': ' + elName;

    self._emitOrThrow(new Error(errMsg));
    return;
  }

  var index = nameIndex.get(self.form, el);

  var identity = {
    name: escapedElName,
    tagName: el.tagName,
    type: el.type,
    index: index
  };

  if (el.type == 'radio') {
    // Since all other radiobuttons with the same name are all 'unchecked' when
    // you click one of them, we use the same key to store the index of the
    // selected radio box.
    //
    // Clicking on any radiobox with that name will override that value.
    identity.index = 0;
  }

  var identityString = keyifyIdentity(identity);

  var key = self.key.key(identityString);

  var value;
  if (el.type == 'radio') {
    value = index;

  } else {
    value = elementValue.get(el);
  }

  key.set(value, function(err) {
    if (err) {
      self._emitOrThrow(err);

      return;
    }

    if (cb) {
      return cb();
    }
  });
};

Form.prototype._setEl = function(identity, val, userId) {
  // Radio buttons use the same key.
  // The value that is stored is the index instead.
  if (identity.type == 'radio') {
    identity.index = val;
    val = true;
  }

  var el = nameIndex.find(
    this.form,
    identity.tagName,
    identity.name,
    identity.index
  );

  if (!el) {
    var errMsg = 'Form: Could not locate form element ' +
      'as described by other user.' +
      '\n\n' +
      'name: ' + identity.name + '\n' +
      'tagName: ' + identity.tagName + '\n' +
      'type: ' + identity.type + '\n' +
      'index: ' + identity.index;

    this._emitOrThrow(new Error(errMsg));
    return;
  }

  elementValue.set(el, val);

  // If the clickIndicator widget exists check for the click data-goinstant-id
  if (hasClickAncestor(el)) {
    return;
  }

  // There is no userId when initially populating the form values.
  if (userId && this._view) {
    var user = this._usercache.getUser(userId);
    this._view.addIndicator(el, user);
  }
};

function hasClickAncestor(el) {
  if (el.tagName !== 'INPUT') {
    return false;
  }

  if (el.type !== 'radio' && el.type !== 'checkbox') {
    return false;
  }

  if (!window.goinstant.widgets.ClickIndicator) {
    return false;
  }

  var selector = '[' + DATA_GOINSTANT_ID + '=\'' + DATA_GOINSTANT_CLICK + '\']';
  if (!closest(el, selector)) {
    return false;
  }

  return true;
}

Form.prototype._receive = function(val, context) {
  var identityString = _.last(context.key.split('/'), 4).join('/');

  var identity = dekeyifyIdentity(identityString);

  this._setEl(identity, val, context.userId);
};

/**
 * Handler for when a remote user object changes.
 * @param {object} user The updated user object.
 */
Form.prototype._handleUserChange = function(user) {
  if (this._view) {
    this._view.updateIndicator(user);
  }
};

Form.prototype._reset = function() {
  // Check to make sure this reset wasn't called from a channel.on to prevent
  // event bouncing.
  if (!this.local) {
    return;
  }

  var self = this;

  this.key.remove(function(err) {
    if (err) {
      self._emitOrThrow(err);

      return;
    }
  });
};

Form.prototype._receiveReset = function() {
  this.local = false;
  this.form.reset();
  this.local = true;
};

function keyifyIdentity(identity) {
  return [
    identity.tagName,
    identity.type,
    identity.name,
    identity.index
  ].join('/');
}

function dekeyifyIdentity(identityKey) {
  var split = identityKey.split('/');
  return {
    tagName: split[0],
    type: split[1],
    name: elementNames.unescape(split[2]),
    index: split[3]
  };
}
