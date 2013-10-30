/*jshint browser:true*/
/*global module, require*/
'use strict';

/**
 * @fileOverview
 * This module is used to get the index of a named element in a form,
 * and to then use that index, and other information to find the element.
 *
 * This is used to identify an element in the context of a form on one browser,
 * in order to find it on another.
 *
 * Given the following HTML:
 *
 * <form>
 *   <input id=first name="a[]" />
 *   <input id=second name="b" />
 *   <input id=third name="a[]" />
 * </form>
 *
 * nameIndex.get(form, third); // => 1
 * nameIndex.find(form, 'input', 'a[]', 1); // third
 */

var _ = require('lodash');

/**
 * Given an HTMLELement inside of a form, finds the index of that element in
 * reference to names.
 *
 * @param {HTMLFormElement} form The form to look inside.
 * @param {HTMLElement} el the element to find the index of
 * @returns {Number} the index of the HTMLElement
 */
module.exports.get = function(form, el) {
  var tags = form.getElementsByTagName(el.tagName);

  var elementsWithName = _.filter(tags, function(otherEl) {
    return otherEl.type == el.type;
  });

  var elementsWithNameAndType = _.filter(elementsWithName, function(otherEl) {
    return otherEl.name == el.name;
  });

  var index = _.indexOf(elementsWithNameAndType, el);

  return index;
};

/**
 * Given a description of a named tag in a form, finds that element.
 * @param {HTMLFormElement} form the form to search.
 * @param {String} tagName the tag to search for.
 * @param {String} name the HTML name attribute to search for.
 * @param {Number} index
 * @returns {HTMLElement}
 */
module.exports.find = function(form, tagName, name, index) {
  var tags = form.getElementsByTagName(tagName);

  var elementsWithName = _.filter(tags, function(otherEl) {
    return otherEl.name == name;
  });

  return elementsWithName[index];
};
