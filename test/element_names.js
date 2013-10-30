/*jshint browser:true, node:false*/
/*global require*/
'use strict';

describe('elementNames', function() {
  var assert = window.assert;

  var elementNames = require('form/lib/element_names');
  var _ = require('lodash');

  var expectations = [
    {
      escaped: 'awesome',
      unescaped: 'awesome'
    },
    {
      escaped: 'array-GILB-',
      unescaped: 'array['
    },
    {
      escaped: 'array-GIRB-',
      unescaped: 'array]'
    },
    {
      escaped: 'array-GILB--GIRB-',
      unescaped: 'array[]'
    },
    {
      escaped: 'array-GIRB--GILB-',
      unescaped: 'array]['
    }
  ];

  _.each(expectations, function(vals) {
    it('unescapes ' + vals.escaped + ' to ' + vals.unescaped, function() {
      assert.equal(elementNames.unescape(vals.escaped), vals.unescaped);
    });

    it('escapes ' + vals.unescaped + ' to ' + vals.escaped, function() {
      assert.equal(elementNames.escape(vals.unescaped), vals.escaped);
    });
  });

  it('ignores unescaped values when unescaping', function() {
    assert.equal(elementNames.unescape('[]'), '[]');
  });

  it('ignores escaped values when escaping', function() {
    assert.equal(elementNames.escape('-GIRB--GILB-'), '-GIRB--GILB-');
  });
});
