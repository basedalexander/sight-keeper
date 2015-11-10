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

    chrome.idle.setDetectionInterval(15);

    // Pressed app switcher button
    router.on('setStateOn', function () {
        self._state.setOn();
        self.switchOn();
      }
    );

    router.on('setStateOff', function () {
        self._state.setOff();
        self.switchOff();
      }
    );

    // Pressed the restart sesson button
    router.on('restartSession', function () {
        self.restartSession();
        return self._session.getStartDate();
      }
    );

    // Applying new session period
    router.on('setSessionPeriod', function (message) {
      self._session.setPeriod(message.value);

      self.endSession();
      self.endIdle();
      router.send('idleInded');
      self.startSession();
      router.send('sessionStarted');
    });

    // Applying new idle period
    router.on('setIdlePeriod', function (message) {
      self._idle.setPeriod(message.value);
    });

    // Sounds turned off
    router.on('mute', function () {
      audio.setVolume(0);
    });

    // Sounds turned on
    router.on('unmute', function () {
      audio.setVolume(1);
    });
  }

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

        console.log('session started , period : ' + this._session.getPeriod());
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
            console.log('tracking AFK...');
          }

          // If session time elapsed and user doesn't do any inputs - start
          // idle period.
          if (!sessionRunning && !idleRunning) {
            self.startIdle();
            console.log('idle started , period : ' + self._idle.getPeriod());
          }

          if (idlePaused) {
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
            console.log('stop tracking AFK');
          }

          // If idle period is running and user have made an input -
          // notify user that idle period is not finished yet.
          if (idleRunning) {
            self.pauseIdle();
            notify.idleInterrupted();
            audio.play(1);
          }

          // If idle period finished and user makes an input -
          // start session period and close desktop notification
          // 'idle finished'.
          if (!idleRunning && !sessionRunning) {
            notify.closeIdleEnded();
            self.startSession();
            console.log('session started since did input');
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
          console.log('session ended');
        }, t);
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

      }
    },

    restartSession: {
      value: function restartSession() {
        audio.stop();
        notify.closeAll();
        this.endSession();
        this.startSession();
        router.send('sessionStarted');
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
          console.log('idle ended');

          notify.idleEnded();
          audio.play(3);
        }, t);
      }
    },

    endIdle: {
      value: function endIdle() {

        clearTimeout(this._idle.timeoutId);
        this._idle.timeoutId = null;

        this._idle.resetStatus();
        this._idle.resetStartDate();
        router.send('idleEnded');

      }
    },

    pauseIdle: {
      value: function pauseIdle() {
        this.endIdle();
        this._idle.setStatus('paused');
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

          console.log('session ended by AFK tracker');
        }, t);
      }
    },

    dontTrackAfk: {
      value: function dontTrackAfk() {
        router.send('notAfk');
        clearTimeout(this._afk.timeoutId);
        this._afk.timeoutId = null;
        this._afk.startDate = null;
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
