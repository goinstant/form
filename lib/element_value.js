/*jshint browser:true*/
/*global module, require*/
'use strict';

/** Module dependencies */
var _ = require('lodash');

/** Constants */
var TAG_NAMES = require('./tag_names');
var TYPE = 'type';

function getInputValue(el) {
  switch (el.getAttribute(TYPE)) {
    case 'checkbox':
    case 'radio':
      return el.checked;
    default:
      // XXX Fixes a bug in IE8 where platform stores an empty el.value as
      // 'null'. Likely an issue with JSON.stringify in IE8:
      // http://stackoverflow.com/questions/13850170
      return el.value === '' ? '' : el.value;
  }
}

function setInputValue(el, value) {
  switch (el.getAttribute(TYPE)) {
    case 'checkbox':
    case 'radio':
      el.checked = value;
      break;
    default:
      el.value = value;
      break;
  }
}

function getSelectedIndices(el) {
  if (el.multiple) {
    var opts = _.toArray(el.options);
    return _.transform(opts, function(result, option, index) {
      if (option.selected) {
        result.push(index);
      }
    });

  } else {
    return [ el.selectedIndex ];
  }
}

function setSelectedIndices(el, selectedIndices) {
  if (el.multiple) {
    _.each(el.options, function(opt) {
      opt.selected = false;
    });

    _.each(selectedIndices, function(index) {
      el.options[index].selected = true;
    });

  } else {
    el.selectedIndex = selectedIndices[0];
  }
}

module.exports.get = function(el) {
  if (el.tagName === TAG_NAMES.INPUT) {
    return getInputValue(el);

  } else if (el.tagName === TAG_NAMES.SELECT) {
    return getSelectedIndices(el);

  } else {
    return el.value;
  }
};

module.exports.set = function(el, value) {
  if (el.tagName === TAG_NAMES.INPUT) {
    return setInputValue(el, value);

  } else if (el.tagName === TAG_NAMES.SELECT) {
    return setSelectedIndices(el, value);

  } else {
    el.value = value;
    return;
  }
};
