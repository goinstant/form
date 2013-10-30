/*jshint browser:true */
/*global module, require */
'use strict';

/**
 * @fileOverview
 * Contains the logic for manipulating the view (the UI) for the form
 * component.
 */

var _ = require('lodash');

var colors = require('colors-common');

var TEMPLATE = require('../templates/indicator.html');

var MIN_DOC_PADDING = 10;

/**
 * @constructor
 */
function View(displayTimer) {
  this._items = [];
  this._container = document.createElement('div');
  this._container.className = 'gi-override gi-form';
  this._displayTimer = displayTimer;
}

/**
 * Initialize the view.
 */
View.prototype.initialize = function() {
  document.body.appendChild(this._container);
};

/**
 * Destroy the view. Removes all added nodes and clears any existing timeouts.
 */
View.prototype.destroy = function() {
  this._container.parentNode.removeChild(this._container);

  _.each(this._items, function(indicator) {
    window.clearTimeout(indicator.timeout);
  });
};

/**
 * Adds an indicator for the specified form element and user.
 * @param {HTMLElement} el The element being interacted with. The indicator will
 *                         be positioned above this element.
 * @param {object} user The user object for the user interacting with the
 *                      element.
 */
View.prototype.addIndicator = function(el, user) {
  // Retrieve existing indicator for this user.
  var indicator;
  var item = this._getItem(user);

  if (item) {
    // Clear the timeout, as it will be reset for this new activity.
    indicator = item.indicator;
    window.clearTimeout(item.timeout);
  } else {
    // No existing indicator, make a new one.
    indicator = this._createIndicator(user);
    item = { indicator: indicator };
    this._items.push(item);
  }

  // Remove the indicator if there is no additional activity within the allotted
  // time.
  var removeFn = _.bind(this.removeIndicator, this, indicator);
  item.timeout = window.setTimeout(removeFn, this._displayTimer);

  // Position the indicator above the element.
  var pos = this._getPosition(el);
  indicator.style.bottom = -pos.top + 'px';
  indicator.style.left = pos.left + 'px';
  indicator.style.width = el.offsetWidth + 'px';

  // If that's too close to the top of the document move it below the element
  // instead.
  if (indicator.offsetTop < MIN_DOC_PADDING) {
    indicator.style.top = pos.bottom + 'px';
    indicator.querySelector('.gi-bar').style.top = 0;
    indicator.querySelector('.gi-user').style.top = '3px';
  }
};

/**
 * Removes the specified indicator from the DOM and clears the removal
 * timeout.
 * @param {HTMLElement} indicator The indicator to remove.
 */
View.prototype.removeIndicator = function(indicator) {
  var index = _.find(this._items, { indicator: indicator });

  if (index < 0) {
    throw new Error('Attempt to remove unknown indicator: ' +
                    indicator['data-goinstant-id']);
  }

  var item = this._items.splice(index, 1)[0];
  window.clearTimeout(item.timeout);
  indicator.parentNode.removeChild(indicator);
};

/**
 * Updates any existing indicator for the supplied user. This is used to update
 * the indicator content/color if the user name, color, etc, change. If there
 * is no existing indicator for this element then this does nothing.
 * @param {object} user The updated user object to use to update the indicator.
 */
View.prototype.updateIndicator = function(user) {
  var item = this._getItem(user);

  if (!item) {
    return;
  }

  var indicator = item.indicator;

  var nameEl = indicator.querySelector('.gi-user');
  nameEl.textContent = nameEl.innerText = user.displayName; // innerText for IE8

  _.each(indicator.childNodes, function(node) {
    if (node.nodeType === 1) {
      node.style.backgroundColor = colors.get(user);
    }
  });
};

/**
 * @private
 * @return {object} The item (indicator + timeout pair) for the specified user,
 *                  or undefined if there is no existing indicator.
 */
View.prototype._getItem = function(user) {
  var item = _.find(this._items, function(item) {
    return item.indicator.getAttribute('data-goinstant-id') === user.id;
  });

  return item;
};

/**
 * Creates and returns a new indicator element.
 * @private
 * @param {object} user The user object for the user who initiated the
 *                      indicator.
 * @return {HTMLElement} The created indicator element.
 */
View.prototype._createIndicator = function(user) {
  var tmplVars = {
    id: user.id,
    color: colors.get(user),
    displayName: user.displayName
  };

  var html = _.template(TEMPLATE, tmplVars);

  // Create the indicator in a document fragment first. This is required so as
  // not to affect existing references to nodes in the container.
  var frag = document.createDocumentFragment();
  var div = document.createElement('div');
  frag.appendChild(div);
  div.innerHTML += html;

  // Find the created indicator by looking for the last element child.
  var indicator = div.lastChild;
  while (indicator.nodeType !== 1) {
    indicator = indicator.previousSibling;
  }

  // Append the node to the container.
  this._container.appendChild(indicator);

  return indicator;
};

/**
 * Gets the position of the element relative to the document in a cross-browser
 * way (i.e. supports IE8)
 */
View.prototype._getPosition = function(elem) {
  var box = elem.getBoundingClientRect();
  var docElem = document.documentElement || document.body.parentNode ||
                document.body;
  var top = (window.scrollY !== undefined) ? window.scrollY : docElem.scrollTop;
  var left = (window.scrollX !== undefined) ? window.scrollX :
                                              docElem.scrollLeft;

  return {
    top: box.top + top,
    left: box.left + left,
    right: box.right + left,
    bottom: box.bottom + top
  };
};

module.exports = View;
