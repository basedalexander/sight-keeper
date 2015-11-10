// TODO there is no way to check the states of modules's private attributes,
// because of incapsulation.
// Consider to move them from perivate  to pseudoprivate using underscore prefix

var expect = require('chai').expect,
  sinon = require('sinon'),
  Static = require('../src/js/Static'),
  Period = require('../src/js/Period'),
  Router = require('../src/js/Router'),
  notify = require('../src/js/notify'),
  utils = require('../src/js/utils'),
  badger = require('../src/js/badger');

  window.chrome = require('./chrome-mock');


describe('Static module', function () {
  var staticProp = new Static('name', 'defaultValue');

  it('checks data types and methods', function () {
    expect(staticProp.name).to.equal('name');
    expect(staticProp.defaultValue).to.equal('defaultValue');
    expect(staticProp.load).ok;
    expect(staticProp.save).ok;
    expect(staticProp.reset).ok;
  });

  it('.load()', function () {
    var getItem = sinon.stub(window.localStorage, 'getItem'),
      reset = sinon.stub(staticProp, 'reset');

    getItem.onCall(0).returns('dick');
    getItem.onCall(1).returns(null);

    expect(staticProp.load()).equal('dick');
    expect(reset.calledOnce).not.ok;

    staticProp.load();
    expect(reset.calledOnce).ok;

    getItem.restore();
    reset.restore();
  });

  it('.save()', function () {
    var setItem = sinon.spy(window.localStorage, 'setItem'),
      load = sinon.spy(staticProp, 'load');

    staticProp.save('dick');
    expect(setItem.calledWith(staticProp.name, 'dick')).ok;
    expect(load.calledOnce).ok;

    setItem.restore();
    load.restore();
  });

  it('.reset()', function () {
    var save = sinon.spy(staticProp, 'save');
    staticProp.reset();
    expect(save.calledOnce).ok;

    save.restore();
  });
});

describe("Router module", function() {
   var router = new Router('backend'),
    router2 = new Router('frontend');

   it('.send()', function () {
        var sendMessage = sinon.spy(chrome.runtime, 'sendMessage'),
        cb = function () {};

        router.send('status', 'off', cb);

        expect(sendMessage.calledOnce).ok;
        expect(sendMessage.args[0][0]).to.deep.equal({
            id: 'backend',
            name: 'status',
            value: 'off'
        });
        expect(sendMessage.args[0][1]).to.deep.equal(cb);

        sendMessage.restore();
   });
   it(".on()", function() {
      var addListener = sinon.spy(chrome.runtime.onMessage, 'addListener');
      router.on('session', function () {});
      expect(addListener.calledOnce).ok;
      addListener.restore();
   });
   it(".deregister()", function() {

    var removeListener = sinon.spy(chrome.runtime.onMessage, 'removeListener');
    router.deregister('see');

    // todo not so verbose as it should, can't check private "listeners" object
    expect(removeListener.calledOnce).not.ok;
    removeListener.restore();
   });
});

describe("notify module", function() {
   var create = sinon.spy(chrome.notifications, 'create'),
        clear = sinon.spy(chrome.notifications, 'clear');

    after(function () {
        create.restore();
        clear.restore();
    });

    it(".sessionEnded()", function() {
       notify.sessionEnded();
       expect(create.calledOnce).ok;
       expect(create.args[0][0]).to.be.a('string');
       expect(create.args[0][1]).to.be.an('object');
       expect(create.args[0][2]).to.be.a('function');
    });

    it('.idleEnded', function () {
        notify.idleInterrupted();
        expect(create.calledTwice).ok;
        expect(create.args[1][0]).to.be.a('string');
        expect(create.args[1][1]).to.be.an('object');
        expect(create.args[1][2]).to.be.a('function');
    });

    it('.closeAll', function () {
        notify.closeAll();
        expect(clear.calledThrice).ok;
    });
});

describe("badger module", function() {
   var setIcon = sinon.spy(chrome.browserAction, 'setIcon');
   badger.enableIcon();
   badger.disableIcon();
   expect(setIcon.calledTwice).ok;
   setIcon.restore();
});

describe("utils module", function() {
    it("ms2min", function() {
       expect(utils.ms2min(60000)).to.equal(1);
       expect(utils.ms2min(30000)).to.equal(0.5);
       expect(utils.ms2min(15000)).to.equal(0.3);
    });
    it("min2ms", function() {
       expect(utils.min2ms(1)).to.equal(60000);
       expect(utils.min2ms(0.5)).to.equal(30000);
       expect(utils.min2ms(41)).to.equal(2460000);
    });
    it("sec2ms", function() {
       expect(utils.sec2ms(6)).to.equal(6000);
       expect(utils.sec2ms(26)).to.equal(26000);
    });
    it("ms2sec", function() {
       expect(utils.ms2sec(60000)).to.equal(60);
    });
});


