'use strict';

var _createClass = (function () {
  function defineProperties(target, props) {
    var key, prop;
    for (key in props) {
      if (props.hasOwnProperty(key)) {
        prop = props[key];
        prop.configurable = true;
        if (prop.value) {
          prop.writable = true;
        }
      }
    }
    Object.defineProperties(target, props);
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) {
      defineProperties(Constructor.prototype, protoProps);
    }
    if (staticProps) {
      defineProperties(Constructor, staticProps);
    }
    return Constructor;
  };
})();

var _classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var state = require('./state'),
  Period = require('./Period'),
  Router = require('./Router'),
  badger = require('./badger'),
  utils = require('./utils'),
  notify = require('./notify'),
  audio = require('./audio'),
  router = new Router('backend');

console.info('Engine module');


var Engine = (function () {

  var self;

  function Engine() {
    _classCallCheck(this, Engine);

    // To save current this in outer scope
    self = this;

    this._state = state;
    this._session = new Period('session', '60000'),
    this._idle = new Period('idle', '30000'),
    this._afk = {
        timeoutId: null,
        startDate: null
      };


    // Initialize app
    this.switcher();

    // @link
    // https://developer.chrome.com/extensions/idle#method-setDetectionInterval
    chrome.idle.setDetectionInterval(15);

    router
      // Pressed app switcher button
      .on('setStateOn', function () {
        self._state.setOn();
        self.switchOn();
      })

      .on('setStateOff', function () {
        self._state.setOff();
        self.switchOff();
      })

      // Pressed the restart sesson button
      .on('restartSession', function () {
        self.restartSession();
        return self._session.getStartDate();
      })

      // Applying new session period
      .on('setSessionPeriod', function (message) {
        self._session.setPeriod(message.value);
        self.endSession();
        self.endIdle();
        router.send('idleInded');
        self.startSession();
        router.send('sessionStarted');
      })

      // Applying new idle period
      .on('setIdlePeriod', function (message) {
        self._idle.setPeriod(message.value);
      })

      // Sounds turned off
      .on('mute', function () {
        audio.setVolume(0);
      })

      // Sounds turned on
      .on('unmute', function () {
        audio.setVolume(1);
      });
  }
  // TODO consider to move that to 'extend' pattern
  _createClass(Engine, {
    switcher: {

      // When app started, it checks whether state on or off, and run
      // appropriate switch function
      value: function switcher() {
        if (this._state.isOn()) {
          this.switchOn();
        }
      }
    },

    switchOn: {
      value: function switchOn() {
        console.info('switched ON');
        this.addIdleListener();
        this.addNotifyBtnListener();
        this.startSession();
        router.send('sessionStarted');
        badger.enableIcon();
      }
    },

    switchOff: {
      value: function switchOff() {
        console.info('SK is OFF');

        if (this.isAfk()) {
          this.dontTrackAfk();
        }

        this.endSession();
        router.send('sessionEnded');
        this.endIdle();
        router.send('idleInded');
        this.rmIdleListener();
        this.rmNotifyBtnListener();
        badger.disableIcon();
        audio.stop();
        notify.closeAll();
      }
    },

    idleListener: {
      value: function idleListener(idleState) {
        console.log(idleState + ' fired');

        var idleRunning = self._idle.isRunning(),
          sessionRunning = self._session.isRunning(),
          idlePaused = self._idle.isPaused();

        // If app state is 'off' - ignore
        if (!self._state.isOn()) {
          return;
        }

        // IDLE state fired!
        if (idleState === 'idle') {

          // If session is running and user goes afk ,
          // start countdown certain amount of time, after witch
          // app assumes that user have rested.
          if (sessionRunning) {
            self.trackAfk();
          }

          // If session time elapsed and user doesn't do any inputs - start
          // idle period.
          if (!sessionRunning && !idleRunning) {
            self.startIdle();
          }

          router.send('idle');
        }


        // ACTIVE state fired!
        if (idleState === 'active') {

          // If user was afk while session was running -
          // stop countdown afk time.
          if (sessionRunning) {
            self.dontTrackAfk();
          }

          // If idle period is running and user have made an input -
          // notify user that idle period is not finished yet.
          if (idleRunning) {
            self.endIdle();
            notify.idleInterrupted();
            audio.play(1);
          }

          // If idle period finished and user makes an input -
          // start session period and close desktop notification
          // 'idle finished'.
          if (!idleRunning && !sessionRunning) {
            notify.closeIdleEnded();
            self.startSession();
          }

          router.send('active');
        }
      }
    },

    addIdleListener: {
      value: function addIdleListener() {
        chrome.idle.onStateChanged.addListener(this.idleListener);
        console.log('idle listener added');
      }
    },

    rmIdleListener: {
      value: function rmIdleListener() {
        chrome.idle.onStateChanged.removeListener(this.idleListener);
        console.log('idle listener removed');
      }
    },

    notifyBtnListener: {
      value: function notifyBtnListener(id, buttonIndex) {

        // Chrome notification button's handler
        // @link https://developer.chrome.com/apps/notifications#event-onButtonClicked

        // Close notification when user clicks any button
        chrome.notifications.clear(id, function () {
        });

        if (id === 'sessionEnd') {

          if (buttonIndex === 0) {
            self.startSession();
            console.log('session started by skipping idle ,' +
              ' period : ' + utils.ms2min(self._session.getPeriod()) + ' min');
          } else {

            // TODO make this value configurable.
            // get rid of hardcode
            self.startSession(5 * 60000);
            console.log('session started , reminder, period : 5 mins');
          }
        }

        if (id === 'idleInterrupted') {


          if (buttonIndex === 0) {
            self.endIdle();
            self.startSession();
          }
        }

        router.send('sessionStarted');
      }
    },

    addNotifyBtnListener: {
      value: function addBtnListener() {
        chrome.notifications.onButtonClicked.addListener(this.notifyBtnListener);
        console.log('btn listener added');
      }
    },

    rmNotifyBtnListener: {
      value: function rmBtnListener() {
        chrome.notifications.onButtonClicked.removeListener(this.notifyBtnListener);
        console.log('btn listener removed');
      }
    },

    startSession: {
      value: function startSession(time) {
        var t = time || +this._session.getPeriod();

        this._session.setStatus('running');
        this._session.setStartDate(Date.now());

        router.send('sessionStarted');

        this._session.timeoutId = setTimeout(function () {
          if (!self.isAfk()) {
            notify.sessionEnded();
            audio.play(1);
          } else {
            audio.play(1);
          }

          self.endSession();
        }, t);

        console.log('session started');
      }
    },

    endSession: {
      value: function endSession() {

        // For cases when user was idling (was called trackAfk())
        clearTimeout(this._session.timeoutId);
        this._session.timeoutId = null;

        // Sets session status to default ('stopped')
        this._session.resetStatus();

        // Sets session startDate to default ('0')
        this._session.resetStartDate();

        router.send('sessionEnded');


        // If session period finished while user is still afk - run idle
        // manually
        // @link https://developer.chrome.com/extensions/idle#method-queryState
        if (this.isAfk()) {
          this.dontTrackAfk();
          this.startIdle();
          console.log('idle started manually');
        }

        console.log('session ended');
      }
    },

    restartSession: {
      value: function restartSession() {
        audio.stop();
        notify.closeAll();
        this.endSession();
        this.startSession();
      }
    },

    startIdle: {
      value: function startIdle(time) {
        var t = time || +this._idle.getPeriod();

        this._idle.setStatus('running');
        this._idle.setStartDate(Date.now());

        router.send('idleStarted');

        this._idle.timeoutId = setTimeout(function () {
          self.endIdle();

          notify.idleEnded();
          audio.play(3);
        }, t);

        console.log('idle started');
      }
    },

    endIdle: {
      value: function endIdle() {

        clearTimeout(this._idle.timeoutId);
        this._idle.timeoutId = null;

        this._idle.resetStatus();
        this._idle.resetStartDate();
        router.send('idleEnded');

        console.log('idle ended');
      }
    },

    pauseIdle: {
      value: function pauseIdle() {
        this.endIdle();
        this._idle.setStatus('paused');

        console.log('idle paused');
      }
    },

    trackAfk: {
      value: function trackAfk() {
        var t = this._idle.getPeriod();
        this._afk.startDate = Date.now();

        router.send('afk', this._afk.startDate);

        this._afk.timeoutId = setTimeout(function () {
          self.dontTrackAfk();
          self.endSession();
          router.send('sessionEnded');
          console.log('AFK session ended');
        }, t);

        console.log('AFK tracking...');
      }
    },

    dontTrackAfk: {
      value: function dontTrackAfk() {
        router.send('notAfk');
        clearTimeout(this._afk.timeoutId);
        this._afk.timeoutId = null;
        this._afk.startDate = null;

        console.log('AFK stopped');
      }
    },

    isAfk: {
      value: function isAfk() {
        return !!this._afk.timeoutId;
      }
    }

  });

  return Engine;
})();


module.exports = Engine;
