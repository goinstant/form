/*jshint browser:true, node:false*/
/*global require*/
'use strict';

describe('nameIndex', function() {
  var assert = window.assert;

  var nameIndex = require('form/lib/name_index');

  var form;
  var first;
  var second;
  var third;
  var otherTag;

  beforeEach(function() {
    var sharedName = 'a';
    form = document.createElement('form');
    first = document.createElement('input');
    first.name = sharedName;

    second = document.createElement('input');
    second.name = 'b';

    otherTag = document.createElement('textarea');
    otherTag.name = sharedName;

    third = document.createElement('input');
    third.name = sharedName;

    form.appendChild(first);
    form.appendChild(second);
    form.appendChild(otherTag);
    form.appendChild(third);
  });

  describe('get', function() {
    it('returns index of element in other named elements', function() {
      assert.equal(nameIndex.get(form, third), 1);
    });
  });

  describe('find', function() {
    it('returns third when given the proper inputs', function() {
      var elFound = nameIndex.find(form, third.tagName, third.name, 1);
      assert.equal(elFound, third);
    });

    it('returns first when given the proper inputs', function() {
      var elFound = nameIndex.find(form, third.tagName, third.name, 0);
      assert.equal(elFound, first);
    });
  });
});
