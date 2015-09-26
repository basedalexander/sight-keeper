describe('SK background.js', function () {
  it('SK object exists', function () {
    expect(typeof SK).not.toBe('undefined');
  });



  it('SK has all the necessary methods and properties', function () {
    expect(SK.state).not.toBe('undefined');

    expect(SK.session).not.toBe('undefined');

    expect(SK.idle).not.toBe('undefined');

    expect(SK.router).not.toBe('undefined');
  });


  it('initially reset *.status and *.startDate', function () {
    expect(SK.session.status.load()).toBe('stopped');

    expect(SK.idle.status.load()).toBe('stopped');

    expect(SK.session.startDate.load()).toBe('0');

    expect(SK.idle.startDate.load()).toBe('0');
  });
});






describe('Static module', function () {
  it('load() reset() save()', function () {
    expect(SK.state.load()).toBe('on');

    expect(SK.state.save('off')).toBe('off');

    expect(SK.state.load()).toBe('off');

    expect(SK.state.reset()).toBe('on');
  });
});






describe('Router module', function () {

  beforeEach(function () {
    chrome = {
      runtime: {
        sendMessage: function () {},

        onMessage: {
          addListener: function () {}
        }
      }
    };

    router = {
      onHandler: function () {}
    };

    spyOn(chrome.runtime, 'sendMessage');

    spyOn(chrome.runtime.onMessage, 'addListener');

    spyOn(router, 'onHandler');

    SK.router.send('state', 'off', function () {});

    SK.router.on('state', router.onHandler);
  });


  it('router.send()', function () {

    expect(chrome.runtime.sendMessage).toHaveBeenCalled();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 'bg',
      name: 'state',
      value: 'off'
    }), jasmine.any(Function));
  });


  it('router.on()', function () {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(jasmine.any(Function));
  });
});






describe('Badger module', function () {
  beforeEach(function () {
    chrome = {
      browserAction: {
        setIcon: function () {},
      }
    };

    spyOn(chrome.browserAction, 'setIcon');

    SK.enableIcon();
    SK.disableIcon();
  });

  it('enableIcon()', function () {
    expect(chrome.browserAction.setIcon.calls.count()).toEqual(2);

    expect(chrome.browserAction.setIcon.calls.argsFor(0)).toEqual([
      jasmine.objectContaining({
        path: '../img/popup-icon-on-19.png'
      }),
      jasmine.any(Function)
    ]);
  });

  it('disableIcon()', function () {
    expect(chrome.browserAction.setIcon.calls.count()).toEqual(2);

    expect(chrome.browserAction.setIcon.calls.argsFor(1)).toEqual([
      jasmine.objectContaining({
        path: '../img/popup-icon-off-19.png'
      }),
      jasmine.any(Function)
    ]);
  });
});






describe('Converter module', function () {
  it('ms2min', function () {
    expect(SK.ms2min(60000)).toEqual(1.0);

    expect(SK.ms2min('60000')).toEqual(1.0);

    expect(SK.ms2min(90000)).toEqual(1.5);

    expect(SK.ms2min(937582)).toEqual(15.6);
  });

  it('min2ms', function () {
    expect(SK.min2ms(2)).toEqual(120000);

    expect(SK.min2ms('2')).toEqual(120000);

    expect(SK.min2ms(2.4)).toEqual(144000);
  });
});






describe('Audio module', function () {

  beforeEach(function () {
    spyOn(SK.audio, 'play');

    SK.volumeStatic.reset();
  });

  it('playSound()', function () {
    SK.playSound(1);

    expect(SK.audio.getAttribute('src')).toEqual('audio/1.ogg');

    expect(SK.audio.play).toHaveBeenCalled();

    expect(SK.audio.volume).toBe(1);
  });

  it('stopSound()', function () {
    SK.stopSound();

    expect(SK.audio.getAttribute('src')).toEqual('');
  });
});




describe('Notify module', function () {
  beforeEach(function () {
    chrome = {
      notifications: {
        create: function () {},

        clear: function () {},

        onButtonClicked: {
          addListener: function () {},

          removeListener: function () {}
        },
        onClicked: {
          addListener: function () {},

          removeListener: function () {}
        }
      }
    };


    spyOn(chrome.notifications, 'create');

    spyOn(chrome.notifications, 'clear');

    spyOn(chrome.notifications.onButtonClicked, 'addListener');

    spyOn(chrome.notifications.onButtonClicked, 'removeListener');

    spyOn(chrome.notifications.onClicked, 'addListener');
  });



  it('notifySessionEnd()', function () {
    SK.notifySessionEnd();

    expect(chrome.notifications.create).toHaveBeenCalled();
    expect(chrome.notifications.create).toHaveBeenCalledWith('sessionEnd', jasmine.any(Object), jasmine.any(Function));
  });



  it('notifyIdleEnd()', function () {
    SK.notifyIdleEnd();

    expect(typeof SK.notificationIdleEnd).not.toBe('undefined');
    expect(SK.notificationIdleEnd instanceof Notification).toBe(true);
  });

  it('closeIdleEnd()', function () {
    SK.closeIdleEnd();

    expect(typeof SK.notificationIdleEnd).toEqual('undefined');
  });

  it('notifyCloseAll()', function () {
    spyOn(SK, 'closeIdleEnd');

    SK.notifyCloseAll();

    expect(SK.closeIdleEnd).toHaveBeenCalled();
  });
});





describe('Main functionality', function () {
  it('startSession()', function () {

    this.session = {
      period: {
        save: function () {},
        load: function () {
          return '50';
        }
      },
      status: {
        save: function () {},
        load: function () {
          return 'running';
        }
      },
      startDate: {
        load: function () {
          return '2262626';
        },
        save: function () {}
      },
      timerId: null
    };

    this.endSession = function () {};

    spyOn(this, 'endSession');
    spyOn(this.session.period, 'save');
    spyOn(this.session.period, 'load').and.callThrough();
    spyOn(this.session.status, 'save');
    spyOn(this.session.status, 'load').and.callThrough();
    spyOn(this.session.startDate, 'save');
    spyOn(this.session.startDate, 'load').and.callThrough();

    jasmine.clock().install();

    SK.startSession.call(this);

    expect(this.session.status.save).toHaveBeenCalledWith('running');
    expect(this.session.startDate.save).toHaveBeenCalledWith(jasmine.any(Number));
    expect(this.session.timerId).not.toEqual(null);

    jasmine.clock().tick(51);

    expect(this.endSession).toHaveBeenCalled();

    jasmine.clock().uninstall();
  });



  it('endSession()', function () {

    spyOn(SK, 'notifySessionEnd');
    SK.endSession();

    expect(SK.session.status.load()).toEqual('stopped');

    expect(SK.session.startDate.load()).toEqual('0');

    expect(SK.session.timerId).toEqual(null);

    expect(SK.notifySessionEnd).toHaveBeenCalled();
  });


  it('startIdle()', function () {
    this.idle = {
      period: {
        save: function () {},
        load: function () {
          return '50';
        }
      },
      status: {
        save: function () {},
        load: function () {
          return 'running';
        }
      },
      startDate: {
        load: function () {
          return '2262626';
        },
        save: function () {}
      },
      timerId: null
    };

    this.endIdle = function () {};


    spyOn(this, 'endIdle');
    spyOn(this.idle.period, 'save');
    spyOn(this.idle.period, 'load').and.callThrough();
    spyOn(this.idle.status, 'save');
    spyOn(this.idle.status, 'load').and.callThrough();
    spyOn(this.idle.startDate, 'save');
    spyOn(this.idle.startDate, 'load').and.callThrough();

    jasmine.clock().install();

    SK.startIdle.call(this);

    expect(this.idle.status.save).toHaveBeenCalledWith('running');
    expect(this.idle.startDate.save).toHaveBeenCalledWith(jasmine.any(Number));
    expect(this.idle.timerId).not.toEqual(null);

    jasmine.clock().tick(51);

    expect(this.endIdle).toHaveBeenCalled();

    jasmine.clock().uninstall();
  });


  it('endIdle()', function () {
    SK.endIdle();

    expect(SK.idle.status.load()).toEqual('stopped');

    expect(SK.idle.startDate.load()).toEqual('0');

    expect(SK.idle.timerId).toEqual(null);
  });


  it('trackAfk()', function () {

    // Mock
    this.idle = {
      period: {
        load: function () {
          return '50';
        }
      }
    };

    this.endSession = function () {};
    this.afkId = null;


    spyOn(this, 'endSession');
    spyOn(this.idle.period, 'load').and.callThrough();

    // Using jasmine Clock
    // @link http://jasmine.github.io/edge/introduction.html#section-Jasmine_Clock
    jasmine.clock().install();

    SK.trackAfk.call(this);

    expect(this.afkId).not.toEqual(null);
    expect(this.idle.period.load).toHaveBeenCalled();

    // Right after period time
    jasmine.clock().tick(51);

    expect(this.endSession).toHaveBeenCalled();

    jasmine.clock().uninstall();
  });


  it('dontTrackAfk()', function () {
    this.afkId = 1;
    SK.dontTrackAfk.call(this);

    expect(this.afkId).toEqual(null);
  });


  it('switcher()', function () {
    this.state = {
      save: function () {},
      load: function () {}
    };

    this.switchOn = function () {};

    spyOn(this.state, 'load').and.returnValues('off', 'on');
    spyOn(this, 'switchOn');
    SK.switcher.call(this);

    expect(this.state.load).toHaveBeenCalled();
    expect(this.switchOn).not.toHaveBeenCalled();


    SK.switcher.call(this);

    expect(this.state.load).toHaveBeenCalled();
    expect(this.switchOn).toHaveBeenCalled();
  });

  it('switchOn()', function () {
    this.startSession = function () {};
    this.startListenToIdleState = function () {};
    this.enableIcon = function () {};

    spyOn(this, 'startSession');
    spyOn(this, 'startListenToIdleState');
    spyOn(this, 'enableIcon');

    SK.switchOn.call(this);

    expect(this.startSession).toHaveBeenCalled();
    expect(this.startListenToIdleState).toHaveBeenCalled();
    expect(this.enableIcon).toHaveBeenCalled();
  });

  it('switchOff()', function () {
    this.endSession = function () {};
    this.endIdle = function () {};
    this.stopListenToIdleState = function () {};
    this.disableIcon = function () {};
    this.stopSound = function () {};
    this.notifyCloseAll = function () {};

    spyOn(this, 'endSession');
    spyOn(this, 'endIdle');
    spyOn(this, 'stopListenToIdleState');
    spyOn(this, 'disableIcon');
    spyOn(this, 'stopSound');
    spyOn(this, 'notifyCloseAll');

    SK.switchOff.call(this);

    expect(this.endSession).toHaveBeenCalled();
    expect(this.endIdle).toHaveBeenCalled();
    expect(this.stopListenToIdleState).toHaveBeenCalled();
    expect(this.disableIcon).toHaveBeenCalled();
    expect(this.stopSound).toHaveBeenCalled();
    expect(this.notifyCloseAll).toHaveBeenCalled();
  });

  it('startListenToIdleState()', function () {
    this.idleStateHandler = function () {};
    chrome = {
      idle: {
        setDetectionInterval: function () {},

        onStateChanged: {
          addListener: function () {}
        }
      }
    };

    spyOn(chrome.idle, 'setDetectionInterval');
    spyOn(chrome.idle.onStateChanged, 'addListener');

    SK.startListenToIdleState.call(this);

    expect(chrome.idle.setDetectionInterval).toHaveBeenCalled();
    expect(chrome.idle.setDetectionInterval).toHaveBeenCalledWith(15);
    expect(chrome.idle.onStateChanged.addListener).toHaveBeenCalled();
    expect(chrome.idle.onStateChanged.addListener).toHaveBeenCalledWith(this.idleStateHandler);
  });

  it('stopListenToIdleState()', function () {
    this.idleStateHandler = function () {};
    chrome = {
      idle: {
        onStateChanged: {
          removeListener: function () {}
        }
      }
    };

    spyOn(chrome.idle.onStateChanged, 'removeListener');

    SK.stopListenToIdleState.call(this);

    expect(chrome.idle.onStateChanged.removeListener).toHaveBeenCalled();
    expect(chrome.idle.onStateChanged.removeListener).toHaveBeenCalledWith(this.idleStateHandler);
  });


});
