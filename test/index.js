// TODO there is no way to check the states of modules's private attributes,
// because of incapsulation.
// Consider to move them from perivate  to pseudoprivate using underscore prefix

var expect = require('chai').expect,
  sinon = require('sinon'),
  Static = require('../src/js/Static'),
  Period = require('../src/js/Period'),
  notify = require('../src/js/notify'),
  utils = require('../src/js/utils'),
  badger = require('../src/js/badger');

window.chrome = require('./chrome-mock');
window.Audio = function () {
  return document.createElement('audio');
};

describe('Static module', function () {
  var Static = require('../src/js/Static');
  var spyGetItem = sinon.spy(window.localStorage, 'getItem');
  var spySetItem = sinon.spy(window.localStorage, 'setItem');


  describe('static instance', function () {
    var staticProp = new Static('name', 'defaultValue');

    it('should contain correct private props with correct values', function () {
      expect(staticProp._name).to.equal('name');
      expect(staticProp._defaultValue).to.equal('defaultValue');
    });
  });

  describe('load method', function () {
    var staticProp = new Static('name', 'defaultValue');
    var reset = sinon.stub(staticProp, 'reset');

    after(function () {
      spyGetItem.reset();
      spySetItem.reset();
      reset.restore();
    });

    it('should return retrieved value ', function () {
      expect(staticProp.load()).to.equal('defaultValue');
      expect(reset.notCalled).ok;
    });

    it('should call reset method is there was an error while retrieving the' +
      ' value', function () {
      window.localStorage.setItem('name', '');
      expect(staticProp.load()).to.equal(undefined);
      expect(reset.calledOnce).ok;
    });
  });

  describe('save method', function () {
    var staticProp = new Static('name', 'defaultValue');

    var load = sinon.stub(staticProp, 'load');

    after(function () {
      spySetItem.reset();
      spySetItem.reset();
      load.restore();
    });

    it('should call localStorage.setItem with correct args', function () {
      staticProp.save('dick');
      expect(spySetItem.lastCall.calledWith(staticProp._name, 'dick')).ok;
    });
    it('should call load method', function () {
      expect(load.calledOnce).ok;
    });
  });

  describe('reset method', function () {
    var staticProp = new Static('name', 'default');
    var save = sinon.stub(staticProp, 'save');
    save.onCall(0).returns('xyz');

    after(function () {
      spyGetItem.reset();
      spySetItem.reset();
      save.restore();
    });

    it('should return default value', function () {
      expect(staticProp.reset()).to.equal('xyz');
    });
    it('should call save method', function () {
      expect(save.calledOnce).ok;
    });
  });
});

describe("Router module", function () {
  var Router = require('../src/js/Router');
  //var router = new Router('backend');
  //var router2 = new Router('frontend');

  describe('router instance', function () {
    var router = new Router('backend');
    it('should have proper private props', function () {
      expect(router._id).to.equal('backend');
      expect(router._listeners).to.deep.equal({});
    });
  });

  describe('on method', function () {
    var router = new Router('backend');
    var addListener = sinon.spy(chrome.runtime.onMessage, 'addListener');
    var messageName = 'session';
    var handler = function () {
    };
    router.on('session', handler);
    it('should proprly create and save new handler to _listeners' +
      ' object', function () {
      expect(router._listeners[messageName]).to.be.a('function');
      expect(addListener.calledWith(router._listeners[messageName])).ok;
      addListener.reset();
    });
    it('should return router object itself', function () {
      expect(router.on('session', function () {
      })).to.equal(router);
    });
  });

  describe('send method ', function () {
    var router = new Router('backend');
    var sendMessage = sinon.spy(chrome.runtime, 'sendMessage');
    var cb = function () {
    };
    router.send('status', 'off', cb);
    it('should call chrome.runtime.sendMEssage method with proper arguments', function () {
      expect(sendMessage.calledOnce).ok;
      expect(sendMessage.args[0][0]).to.deep.equal({
        id: 'backend',
        name: 'status',
        value: 'off'
      });
      expect(sendMessage.args[0][1]).to.equal(cb);
    });
    sendMessage.restore();
  });


  describe('deregister method', function () {
    var removeListener = sinon.spy(chrome.runtime.onMessage, 'removeListener');
    var router = new Router('backend');
    router._listeners.session = function () {
    };
    router.deregister('session');
    it('should call chrome.runtime.onMessage.removeListener', function () {
      expect(removeListener.calledOnce).ok;
    });
    it('should remove handler from _listeners collection', function () {
      expect(typeof router._listeners.session).to.equal('undefined');
    });
    removeListener.restore();
  });
});

describe('state module', function () {
  var state = require('../src/js/state');

  after(function () {
    window.localStorage.clear();
  });

  it('get method should return current state', function () {
    expect(state.get()).to.equal('on');
  });
  it('setOff method should set state to "off" and return this value ', function () {
    state.setOff();
    expect(state.get()).to.equal('off');
  });
  it('setOn method should set state to "on" and return this value ', function () {
    state.setOn();
    expect(state.get()).to.equal('on');
  });
  it('isOn method should return true if current state is "on"', function () {
    expect(state.isOn()).to.equal(true);
  });
});

describe("notify module", function () {
  var create = sinon.spy(chrome.notifications, 'create'),
    clear = sinon.spy(chrome.notifications, 'clear');

  after(function () {
    create.restore();
    clear.restore();
  });

  it(".sessionEnded()", function () {
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

describe("badger module", function () {
  var setIcon = sinon.spy(chrome.browserAction, 'setIcon');
  badger.enableIcon();
  badger.disableIcon();
  expect(setIcon.calledTwice).ok;
  setIcon.restore();
});

describe("utils module", function () {
  it("ms2min", function () {
    expect(utils.ms2min(60000)).to.equal(1);
    expect(utils.ms2min(30000)).to.equal(0.5);
    expect(utils.ms2min(15000)).to.equal(0.3);
  });
  it("min2ms", function () {
    expect(utils.min2ms(1)).to.equal(60000);
    expect(utils.min2ms(0.5)).to.equal(30000);
    expect(utils.min2ms(41)).to.equal(2460000);
  });
  it("sec2ms", function () {
    expect(utils.sec2ms(6)).to.equal(6000);
    expect(utils.sec2ms(26)).to.equal(26000);
  });
  it("ms2sec", function () {
    expect(utils.ms2sec(60000)).to.equal(60);
  });
});

describe('Engine module', function () {

  var Engine = require('../src/js/Engine');
  var engine = new Engine();

  describe('should have all the attributes', function () {
    it('check attributes', function () {
      expect(engine._state).ok;
      expect(engine._session).ok;
      expect(engine._idle).ok;
      expect(engine._afk).ok;
    });
  });

  describe('testing methods ..', function () {
    describe('init method', function () {
      var switchOn;

      beforeEach(function () {
        switchOn = sinon.stub(engine, 'switchOn');
      });
      afterEach(function (){
        switchOn.restore();
      });

      it('should call switchOn ', function () {
        window.localStorage.setItem('state', 'on');
        engine.init();
        expect(switchOn.calledOnce).ok;
        window.localStorage.setItem('state', 'off');
      });
      it('should not call switchOn', function () {
        engine.init();
        expect(switchOn.notCalled).ok;
      });
    });

    describe('switchOn method', function () {

    });
  });
});

