/*jshint browser:true */
/*global require */

/**
 * @fileOverview
 * Contains unit tests for the view class in the form component.
 */

describe('Form View', function() {
  'use strict';

  var $ = require('jquery');
  var sinon = window.sinon;
  var assert = window.assert;
  var colors = require('colors-common');
  var View = require('form/lib/view.js');

  var view;
  var clock;
  var input;
  var user;

  before(function() {
    // Clean up from any other unit tests that don't fully destroy the
    // component.
    $('.gi-form').remove();
  });

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    view = new View(2000);
    view.initialize();
    input = $('<input />').appendTo(document.body).get(0);
    user = {
      displayName: 'user',
      id: 'id'
    };
    user[colors.USER_PROPERTY] = '#f00';
  });

  afterEach(function() {
    $(input).remove();
    view.destroy();
    clock.restore();
  });

  function countIndicators() {
    return $('.gi-indicator').size();
  }

  function getIndicatorText() {
    return $('.gi-user').first().text().replace(/\s+/g, '');
  }

  function getBackgroundColor() {
    return $('.gi-user').first().css('background-color');
  }

  it('adds a container to the page', function() {
    var container = $('.gi-form');
    assert.equal(container.size(), 1);
    assert.isTrue(container.hasClass('gi-override'));
  });

  it('adds an indicator to the page', function() {
    view.addIndicator(input, user);
    assert.equal(countIndicators(), 1);
  });

  it('removes an indicator after 2 seconds', function() {
    view.addIndicator(input, user);
    clock.tick(2000);
    assert.equal(countIndicators(), 0);
  });

  it('resets the timer if add is called again', function() {
    view.addIndicator(input, user);
    clock.tick(1000);
    view.addIndicator(input, user);

    clock.tick(1000);
    assert.equal(countIndicators(), 1);

    clock.tick(1000);
    assert.equal(countIndicators(), 0);
  });

  it('tracks each timer separately', function() {
    view.addIndicator(input, user);
    clock.tick(1000);

    user.id = 'id2';
    view.addIndicator(input, user);
    assert.equal(countIndicators(), 2);

    clock.tick(1000);
    assert.equal(countIndicators(), 1);

    clock.tick(1000);
    assert.equal(countIndicators(), 0);
  });

  it('changes colors and names if the user changes', function() {
    view.addIndicator(input, user);

    // ie8 uses RGB syntax
    var expectedColor = window.addEventListener ? 'rgb(255, 0, 0)' : '#f00';

    assert.equal(getIndicatorText(), user.displayName);
    assert.equal(getBackgroundColor(), expectedColor);

    user.displayName = 'timmy';
    user[colors.USER_PROPERTY] = '#fff';

    view.updateIndicator(user);

    // ie8 uses RGB syntax
    expectedColor = window.addEventListener ? 'rgb(255, 255, 255)' : '#fff';

    assert.equal(getIndicatorText(), user.displayName);
    assert.equal(getBackgroundColor(), expectedColor);
  });
});
