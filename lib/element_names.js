/*jshint browser:true*/
/*global module*/
'use strict';

/**
 * @fileOverview
 * This module is used for escaping and unescaping the names of elements for use
 * as key names.
 */
var elementNames = module.exports;

var LEFT_BRACKET = '[';
var RIGHT_BRACKET = ']';
var LEFT_BRACKET_REPLACEMENT = '-GILB-';
var RIGHT_BRACKET_REPLACEMENT = '-GIRB-';

elementNames.escape = function(str) {
  str = str.replace(/\[/g, LEFT_BRACKET_REPLACEMENT);
  str = str.replace(/\]/g, RIGHT_BRACKET_REPLACEMENT);
  return str;
};

elementNames.unescape = function(str) {
  var LEFT_BRACKET_REPLACEMENT_REGEX =
    new RegExp(LEFT_BRACKET_REPLACEMENT, 'g');

  var RIGHT_BRACKET_REPLACEMENT_REGEX =
    new RegExp(RIGHT_BRACKET_REPLACEMENT, 'g');

  str = str.replace(LEFT_BRACKET_REPLACEMENT_REGEX, LEFT_BRACKET);
  str = str.replace(RIGHT_BRACKET_REPLACEMENT_REGEX, RIGHT_BRACKET);
  return str;
};
