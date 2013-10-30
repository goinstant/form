/*jshint browser:true, node:false*/
/*global require*/
'use strict';

describe('elementValue', function() {
  var assert = window.assert;

  var elementValue = require('form/lib/element_value');
  var _ = require('lodash');

  describe('<input type="text" />', function() {
    it('gets the value of a text input', function() {
      var input = document.createElement('input');
      input.value = 'cool';
      assert.equal(elementValue.get(input), 'cool');
    });

    it('sets the value of a text input', function() {
      var input = document.createElement('input');

      elementValue.set(input, 'cool');
      assert.equal(input.value, 'cool');
    });
  });

  describe('<textarea>', function() {
    it('gets the value of a textarea', function() {
      var textarea = document.createElement('textarea');
      elementValue.set(textarea, 'cool');
      assert.equal(textarea.value, 'cool');
    });
  });

  _.each(['checkbox', 'radio'], function(checkedType) {
    describe('<input type="' + checkedType + '">', function() {
      it('gets the value of an unchecked ' + checkedType, function() {
        var input = document.createElement('input');
        input.type = checkedType;
        assert.equal(elementValue.get(input), false);
      });

      it('sets the value of an unchecked ' + checkedType, function() {
        var input = document.createElement('input');
        input.type = checkedType;

        elementValue.set(input, true);
        assert.equal(input.checked, true);
      });

      it('gets the value of a checked ' + checkedType, function() {
        var input = document.createElement('input');
        input.type = checkedType;
        input.checked = true;

        assert.equal(elementValue.get(input), true);
      });

      it('sets the value of a checked ' + checkedType, function() {
        var input = document.createElement('input');
        input.type = checkedType;

        elementValue.set(input, false);
        assert.equal(input.checked, false);
      });
    });
  });


  describe('<select>', function() {
    it('gets the selected index of a single select', function() {
      var sel = document.createElement('select');
      var opt = document.createElement('option');
      var selectedOpt = document.createElement('option');
      selectedOpt.selected = true;

      sel.appendChild(opt);
      sel.appendChild(selectedOpt);

      assert.deepEqual(elementValue.get(sel), [1]);
    });

    it('gets all the selected indices of a multiple select', function() {
      var sel = document.createElement('select');
      sel.multiple = true;

      var opt = document.createElement('option');
      opt.selected = true;

      var secondOpt = document.createElement('option');
      secondOpt.selected = true;

      var thirdOpt = document.createElement('option');

      sel.appendChild(opt);
      sel.appendChild(secondOpt);
      sel.appendChild(thirdOpt);

      assert.deepEqual(elementValue.get(sel), [0,1]);
    });

    it('sets all the selected indices of a multiple select', function() {
      var sel = document.createElement('select');
      sel.multiple = true;

      var opt = document.createElement('option');
      var secondOpt = document.createElement('option');
      var thirdOpt = document.createElement('option');

      sel.appendChild(opt);
      sel.appendChild(secondOpt);
      sel.appendChild(thirdOpt);

      elementValue.set(sel, [0, 1]);

      assert.isTrue(opt.selected);
      assert.isTrue(secondOpt.selected);
      assert.isFalse(thirdOpt.selected);
    });

    it('sets the selected index of a single select', function() {
      var sel = document.createElement('select');

      var opt = document.createElement('option');
      var secondOpt = document.createElement('option');
      var thirdOpt = document.createElement('option');

      sel.appendChild(opt);
      sel.appendChild(secondOpt);
      sel.appendChild(thirdOpt);

      elementValue.set(sel, [1]);

      assert.isFalse(opt.selected);
      assert.isTrue(secondOpt.selected);
      assert.isFalse(thirdOpt.selected);
    });
  });
});
