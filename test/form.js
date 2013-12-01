/*jshint browser:true, node:false*/
/*global require, describe, it, beforeEach, afterEach*/
'use strict';

describe('Form', function() {
  // This stub must be before the form is included.
  window.goinstant = {
    Key: MockKey
  };

  var Form = require('form/lib/form');

  var TAG_NAMES = require('form/lib/tag_names');
  var elementNames = require('form/lib/element_names');

  var delegate = require('delegate');
  var binder = require('binder');

  var _ = require('lodash');
  var assert = window.assert;
  var sinon = window.sinon;

  var KEY_NAMESPACE_NAME = 'goinstant-widgets-form';

  var DATA_GOINSTANT_ID = 'data-goinstant-id';
  var DATA_GOINSTANT_CLICK = 'gi-click';

  function MockKey() {
    this.key = sinon.stub();
    this.on = sinon.stub();
    this.off = sinon.stub();
    this.set = sinon.stub().yields();
    this.get = sinon.stub().yields(null, {}, {});
    this.remove = sinon.stub();
  }

  function MockRoom() {
    this.mockUserId = 'userId';
    this.user = sinon.stub().yields(null, {
      id: this.mockUserId
    });
    this.key = function() {
      return new MockKey();
    };

    this.on = sinon.stub().callsArg(2);
    this.off = sinon.stub().callsArg(2);
  }

  describe('constructor', function() {
    var validOpts;

    beforeEach(function() {
      var formEl = document.createElement('FORM');
      validOpts = {
        key: new window.goinstant.Key(),
        el: formEl,
        room: new MockRoom()
      };
    });

    it('instantiates when passed proper options', function() {
      return new Form(validOpts);
    });

    describe('validation errors', function() {
      it('fails if passed invalid options', function() {
        assert.exception(function() {
          return new Form({teehee: 'hoo'});
        });
      });

      it('fails if passed a non-key', function() {
        validOpts.key = {};
        assert.exception(function() {
          return new Form(validOpts);
        });
      });

      it('fails if not passed a key', function() {
        delete validOpts.key;
        assert.exception(function() {
          return new Form(validOpts);
        });
      });

      it('fails if not passed a form', function() {
        delete validOpts.el;
        assert.exception(function() {
          return new Form(validOpts);
        });
      });

      it('fails if passed an invalid html element instead of form', function() {
        validOpts.el = document.createElement('INPUT');
        assert.exception(function() {
          return new Form(validOpts);
        });
      });

      it('fails if passed a string instead of form', function() {
        validOpts.el = "";
        assert.exception(function() {
          return new Form(validOpts);
        });
      });
    });
  });

  describe('lifecycle', function() {
    var namespacedKey;
    var key;
    var formEl;
    var form;

    var sandbox;

    beforeEach(function() {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
      sandbox.restore();
    });

    beforeEach(function() {
      sandbox.stub(delegate, 'bind').returns(function(){});
      sandbox.stub(delegate, 'unbind');
      sandbox.stub(binder, 'on').returns(function(){});
      sandbox.stub(binder, 'off');
    });

    beforeEach(function() {
      key = new MockKey();
      namespacedKey = new MockKey();
      key.key.withArgs(Form.NAMESPACE).returns(namespacedKey);

      formEl = document.createElement('FORM');
      form =  new Form({
        el: formEl,
        key: key,
        room: new MockRoom()
      });

      sinon.stub(form._usercache, 'initialize').yields();
    });

    describe('initialize', function() {
      it('retrieves values', function(done) {
        var keyVals = {
          'INPUT': {
            'text': {
              'awesome': {
                0: 'coolio'
              }
            }
          },
          'TEXTAREA': {
            'text': {
              'blossom': {
                0: 'spool'
              }
            }
          }
        };

        var els = {};

        var input = document.createElement('input');
        input.name = 'awesome';
        formEl.appendChild(input);

        var textarea = document.createElement('textarea');
        textarea.name = 'blossom';
        formEl.appendChild(textarea);

        namespacedKey.get = sinon.stub().yields(null, keyVals, {});

        form.initialize(function(err) {
          if (err) {
            return done(err);
          }

          _.each(els, function(el, elName) {
            assert.equal(el.value, keyVals[elName].value);
          });

          done();
        });
      });

      it('binds to the namespaced key', function(done) {
        form.initialize(function(err) {
          if (err) {
            return done(err);
          }

          // also registers a listener to on('remove')
          sinon.assert.calledTwice(namespacedKey.on);

          var expectedOptions = {
            bubble: true,
            listener: sinon.match.func
          };

          sinon.assert.calledWith(
            namespacedKey.on,
            'set',
            expectedOptions
          );

          sinon.assert.calledWith(
            namespacedKey.on,
            'remove',
            sinon.match.func
          );

          done();
        });
      });

      it('binds to the passed DOM element', function(done) {
        form.initialize(function(err) {
          if (err) {
            return done(err);
          }

          sinon.assert.calledWith(
            delegate.bind,
            formEl,
            TAG_NAMES.INPUT,
            'keyup',
            sinon.match.func
          );

          sinon.assert.calledWith(
            delegate.bind,
            formEl,
            TAG_NAMES.INPUT,
            'click',
            sinon.match.func
          );

          sinon.assert.calledWith(
            delegate.bind,
            formEl,
            TAG_NAMES.INPUT,
            'change',
            sinon.match.func
          );

          sinon.assert.calledWith(
            delegate.bind,
            formEl,
            TAG_NAMES.SELECT,
            'change',
            sinon.match.func
          );

          sinon.assert.calledWith(
            delegate.bind,
            formEl,
            TAG_NAMES.TEXTAREA,
            'keyup',
            sinon.match.func
          );

          sinon.assert.calledWith(
            binder.on,
            formEl,
            'reset',
            sinon.match.func
          );

          done();
        });
      });
    });

    describe('destroy', function() {
      beforeEach(function() {
        sinon.stub(form._usercache, 'destroy').yields();
      });
      it('unbinds from the namespaced key', function(done) {
        form.initialize(function(err) {
          if (err) {
            return done(err);
          }

          form.destroy(function(err) {
            if (err) {
              return done(err);
            }

            var listener = namespacedKey.on.args[0][1].listener;

            sinon.assert.calledWith(
              namespacedKey.off,
              'set',
              listener
            );

            sinon.assert.calledWith(
              namespacedKey.off,
              'remove',
              null
            );

            done();
          });
        });
      });

      it('unbinds from the passed DOM element', function(done) {
        form.initialize(function(err) {
          if (err) {
            return done(err);
          }

          form.destroy(function(err) {
            if (err) {
              return done(err);
            }

            sinon.assert.calledWith(
              delegate.unbind,
              formEl,
              'keyup',
              sinon.match.func
            );

            sinon.assert.calledWith(
              delegate.unbind,
              formEl,
              'click',
              sinon.match.func
            );

            sinon.assert.calledWith(
              delegate.unbind,
              formEl,
              'change',
              sinon.match.func
            );

            sinon.assert.calledWith(
              delegate.unbind,
              formEl,
              'change',
              sinon.match.func
            );

            sinon.assert.calledWith(
              delegate.unbind,
              formEl,
              'keyup',
              sinon.match.func
            );

            sinon.assert.calledWith(
              binder.off,
              formEl,
              'reset',
              sinon.match.func
            );

            done();
          });
        });
      });
    });
  });

  describe('capturing a change from a text input', function() {
    var key;
    var namespacedKey;
    var formEl;
    var form;
    var input;
    var inputKey;

    describe('with a whitelist', function() {
      beforeEach(function(done) {
        key = new MockKey();
        namespacedKey = new MockKey();
        key.key.withArgs(Form.NAMESPACE).returns(namespacedKey);

        formEl = document.createElement('FORM');

        input = document.createElement('input');
        input.name = "myname";
        input.value = "woohoo!!!";

        form =  new Form({
          el: formEl,
          key: key,
          room: new MockRoom(),
          include: [
            input.name
          ]
        });

        sinon.stub(form._usercache, 'initialize').yields();
        sinon.stub(form._usercache, 'destroy').yields();

        inputKey = new MockKey();

        namespacedKey.key.withArgs('INPUT/text/myname/0').returns(inputKey);

        formEl.appendChild(input);

        form.initialize(done);
      });

      it('ignores elements not on the whitelist', function(done) {
        var ignorableInput = document.createElement('input');
        ignorableInput.name = 'ignoremeplease';

        var fakeEvt = {
          target: ignorableInput
        };

        form._capture(fakeEvt, function() {
          sinon.assert.notCalled(inputKey.set);

          done();
        });
      });

      it('sets for elements on the whitelist', function(done) {
        var fakeEvt = {
          target: input
        };

        form._capture(fakeEvt, function() {
          sinon.assert.calledOnce(inputKey.set);

          sinon.assert.calledWith(
            inputKey.set,
            input.value
          );

          done();
        });
      });
    });

    describe('without a whitelist', function() {
      beforeEach(function(done) {
        key = new MockKey();
        namespacedKey = new MockKey();
        key.key.withArgs(Form.NAMESPACE).returns(namespacedKey);

        formEl = document.createElement('FORM');
        form =  new Form({
          el: formEl,
          key: key,
          room: new MockRoom()
        });

        sinon.stub(form._usercache, 'initialize').yields();
        sinon.stub(form._usercache, 'destroy').yields();

        input = document.createElement('input');
        input.name = "myname";
        input.value = "woohoo!!!";

        inputKey = new MockKey();

        namespacedKey.key.withArgs('INPUT/text/myname/0').returns(inputKey);

        formEl.appendChild(input);

        form.initialize(done);
      });

      it("sets the proper key element's value", function(done) {
        var fakeEvt = {
          target: input
        };

        form._capture(fakeEvt, function() {
          sinon.assert.calledOnce(inputKey.set);

          sinon.assert.calledWith(
            inputKey.set,
            input.value
          );
          done();
        });
      });

      it('escapes key names when capturing', function(done) {
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'array[]';

        formEl.appendChild(input);

        var inputKey = new MockKey();

        var escapedInputName = elementNames.escape(input.name);

        var keyName = 'INPUT/checkbox/' + escapedInputName + '/0';

        namespacedKey.key.withArgs(keyName)
                     .returns(inputKey);

        var fakeEvt = {
          target: input
        };

        form._capture(fakeEvt, function() {
          sinon.assert.calledOnce(inputKey.set);
          sinon.assert.calledWith(inputKey.set, false);

          done();
        });
      });

      var inputTypes = [
        'button',
        'submit',
        'image',
        'reset',
        'file'
      ];

      _.each(inputTypes, function(type) {
        it('ignores invalid input type ' + type, function(done) {
          var ignorableInput = document.createElement('input');
          ignorableInput.type = type;
          ignorableInput.name = 'haha';

          var fakeEvt = {
            target: ignorableInput
          };

          form._capture(fakeEvt, function() {
            sinon.assert.notCalled(inputKey.set);

            done();
          });
        });
      });
    });
  });

  describe('capturing a change from a radio input', function() {
    var key;
    var namespacedKey;
    var formEl;
    var form;
    var firstInput;
    var secondInput;
    var radioNameKey;

    beforeEach(function(done) {
      key = new MockKey();
      namespacedKey = new MockKey();
      key.key.withArgs(Form.NAMESPACE).returns(namespacedKey);

      formEl = document.createElement('FORM');
      form =  new Form({
        el: formEl,
        key: key,
        room: new MockRoom()
      });

      sinon.stub(form._usercache, 'initialize').yields();
      sinon.stub(form._usercache, 'destroy').yields();

      firstInput = document.createElement('input');
      firstInput.type = 'radio';
      firstInput.name = "myname";
      firstInput.value = "woohoo!!!";

      secondInput = document.createElement('input');
      secondInput.type = 'radio';
      secondInput.name = "myname";
      secondInput.value = "woohoo!!!";

      radioNameKey = new MockKey();

      namespacedKey.key.withArgs('INPUT/radio/myname/0').returns(radioNameKey);

      formEl.appendChild(firstInput);
      formEl.appendChild(secondInput);

      form.initialize(done);
    });

    it("sets the key to the index of the first input", function(done) {
      firstInput.checked = true;

      var fakeEvt = {
        target: firstInput
      };

      form._capture(fakeEvt, function() {
        sinon.assert.calledOnce(radioNameKey.set);

        sinon.assert.calledWith(
          radioNameKey.set,
          0
        );
        done();
      });
    });

    it("sets the key to the index of the second input", function(done) {
      secondInput.checked = true;

      var fakeEvt = {
        target: secondInput
      };

      form._capture(fakeEvt, function() {
        sinon.assert.calledOnce(radioNameKey.set);

        sinon.assert.calledWith(
          radioNameKey.set,
          1
        );
        done();
      });
    });
  });

  describe('receiving a change', function() {
    var key;
    var namespacedKey;
    var formEl;
    var form;

    beforeEach(function(done) {
      key = new MockKey();
      namespacedKey = new MockKey();
      key.key.withArgs(Form.NAMESPACE).returns(namespacedKey);

      formEl = document.createElement('FORM');
      document.body.appendChild(formEl);

      form =  new Form({
        el: formEl,
        key: key,
        room: new MockRoom()
      });

      sinon.stub(form._usercache, 'initialize').yields();
      sinon.stub(form._usercache, 'destroy').yields();
      sinon.stub(form._usercache, 'getUser');

      form.initialize(done);
    });

    afterEach(function(done) {
      formEl.parentNode.removeChild(formEl);
      form.destroy(done);
    });

    it('sets element\'s value', function() {
      var inputName = 'something';
      var firstInput = document.createElement('input');
      var secondInput = document.createElement('input');

      firstInput.name = inputName;
      secondInput.name = inputName;

      formEl.appendChild(firstInput);
      formEl.appendChild(secondInput);

      var mockValue = 'ahaha';

      var mockContext = {
        key: 'nested/INPUT/text/something/1',
        user: {
          id: 3
        }
      };

      form._receive(mockValue, mockContext);

      assert.equal(firstInput.value, '');
      assert.equal(secondInput.value, mockValue);
    });

    it('won\'t display a checkbox indicator with the click widget', function() {
      window.goinstant.widgets = {};
      window.goinstant.widgets.ClickIndicator = sinon.stub();

      var ancestor = document.documentElement;
      ancestor.setAttribute(DATA_GOINSTANT_ID, DATA_GOINSTANT_CLICK);

      var radioInput = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.name = 'something';

      formEl.appendChild(radioInput);

      var mockValue = 0;

      var mockContext = {
        key: 'nested/INPUT/radio/something/0',
        userId: 3
      };

      sinon.stub(form._view, 'addIndicator');
      form._receive(mockValue, mockContext);

      sinon.assert.notCalled(form._view.addIndicator);
    });
  });

  describe('form.reset()', function() {
    var key;
    var namespacedKey;
    var formEl;
    var form;

    beforeEach(function(done) {
      key = new MockKey();
      namespacedKey = new MockKey();

      key.key.withArgs(KEY_NAMESPACE_NAME).returns(namespacedKey);

      formEl = document.createElement('FORM');

      form =  new Form({
        el: formEl,
        key: key,
        room: new MockRoom()
      });

      sinon.stub(form._usercache, 'initialize').yields();
      sinon.stub(form._usercache, 'destroy').yields();

      form.initialize(function(err) {
        done(err);
      });
    });

    it ('removes the namespaced key on form.reset()', function() {
      formEl.reset();

      sinon.assert.calledOnce(namespacedKey.remove);
    });

    it ('calls form.reset() when the namespacedKey is removed', function() {
      formEl.reset = sinon.stub();
      form._receiveReset();

      sinon.assert.calledOnce(formEl.reset);
    });
  });
});
