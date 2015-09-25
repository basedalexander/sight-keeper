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
    SK.startSession();

    expect(SK.session.status.load()).toEqual('running');
    expect(SK.session.startDate.load()).not.toEqual(0);
    expect(typeof SK.session.timerId).not.toEqual('undefined');
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
    SK.startIdle();

    expect(SK.idle.status.load()).toEqual('running');
    expect(SK.idle.startDate.load()).not.toEqual('0');

  });

});
