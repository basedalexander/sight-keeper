'use strict';
//TODO close notification when user goes afk
/**
 * Module dependencies
 */

var state = require('./state'),
  Period = require('./Period'),
  router = require('./Router')('backend'),
  badger = require('./badger'),
  utils = require('./utils'),
  notify = require('./notify'),
  audio = require('./audio');

console.info('Engine module');

var self;

function Engine() {
  _classCallCheck(this, Engine);

  // Save current this in outer scope
  self = this;

  this._state = state;
  this._session = new Period('session', '2700000');
  this._idle = new Period('idle', '300000');
  this._afk = {
    timeoutId: null,
    startDate: null
  };

  // Initialize app
  this.init();

  // @link
  // https://developer.chrome.com/extensions/idle#method-setDetectionInterval
  chrome.idle.setDetectionInterval(15);

  router
    // Pressed app switch button
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

extend(Engine.prototype, {

  init: function init() {
    if (this._state.isOn()) {
      this.switchOn();
    }
  },

  switchOn: function switchOn() {
    console.info('switched ON');
    this.addIdleListener();
    this.addNotifyBtnListener();
    this.startSession();
    router.send('sessionStarted');
    badger.enableIcon();
  },

  switchOff: function switchOff() {
    console.info('SK is OFF');

    if (this.isAfk()) {
      this.dontTrackAfk();
    }

    this.endSession();
    this.endIdle();
    this.rmIdleListener();
    this.rmNotifyBtnListener();
    badger.disableIcon();
    audio.stop();
    notify.closeAll();
  },

  /**
   * Main logic goes here
   * @link https://developer.chrome.com/extensions/idle
   */

  idleListener: function idleListener(idleState) {
    console.log(idleState + ' fired');
    var idleRunning = self._idle.isRunning(),
      sessionRunning = self._session.isRunning();

    /** IDLE FIRED! **/
    if (idleState === 'idle') {

      // If user afk while work period is running - count afk time.
      if (sessionRunning) {
        self.trackAfk();
      }

      // Session period ended, can start idle period.
      if (!sessionRunning && !idleRunning) {
        self.startIdle();
        notify.closeSessionEnded();
      }

      // Notify popup that user is afk
      router.send('idle');
    }


    /** ACTIVE FIRED! **/
    if (idleState === 'active') {

      // User came back, reset afk timer.
      if (sessionRunning) {
        self.dontTrackAfk();
      }

      // User don't want rest.
      if (idleRunning) {
        self.endIdle();
        notify.idleInterrupted();
        audio.play(1);
      }

      // Idle period was finished, and user came back.
      if (!idleRunning && !sessionRunning) {
        notify.closeIdleEnded();
        self.startSession();
      }

      // Notify popup that user if active.
      router.send('active');
    }
  },

  addIdleListener: function addIdleListener() {
    chrome.idle.onStateChanged.addListener(this.idleListener);
    console.log('idle listener added');
  },

  rmIdleListener: function rmIdleListener() {
    chrome.idle.onStateChanged.removeListener(this.idleListener);
    console.log('idle listener removed');
  },


  /**
   * Chrome notification button's handler
   *
   * @param id {string} notification id
   * @param buttonIndex {number}
   * @link https://developer.chrome.com/apps/notifications#event-onButtonClicked
   * TODO: refactor
   */

  notifyBtnListener: function notifyBtnListener(id, buttonIndex) {

    // Imidiately close notification.
    chrome.notifications.clear(id, function () {
    });

    if (id === 'sessionEnd') {

      // Pressed first button
      if (buttonIndex === 0) {
        self.startSession();
      } else {

        // Pressed second button, remind again in 5 minutes
        self.startSession(5 * 60000);
      }
    }

    if (id === 'idleInterrupted') {
      if (buttonIndex === 0) {
        self.endIdle();
        self.startSession();
      }
    }
  },

  addNotifyBtnListener: function addBtnListener() {
    chrome.notifications.onButtonClicked.addListener(this.notifyBtnListener);
    console.log('btn listener added');
  },

  rmNotifyBtnListener: function rmBtnListener() {
    chrome.notifications.onButtonClicked.removeListener(this.notifyBtnListener);
    console.log('btn listener removed');
  },

  startSession: function startSession(time) {
    var t = time || +this._session.getPeriod();
    this._session.setStatus('running');
    this._session.setStartDate(Date.now());

    // Tell popup that session is started.
    router.send('sessionStarted');

    this._session.timeoutId = setTimeout(function () {

      // User is not afk. Show notification.
      if (!self.isAfk()) {
        notify.sessionEnded();
        audio.play(1);
      } else {

        // User is afk. Just play sound.
        audio.play(1);
      }
      self.endSession();
    }, t);

    console.log('session started');
  },

  endSession: function endSession() {
    clearTimeout(this._session.timeoutId);
    this._session.timeoutId = null;
    this._session.resetStatus();
    this._session.resetStartDate();

    // Tell popup that session ended.
    router.send('sessionEnded');

    // User is afk. Start idle period immediately.
    if (this.isAfk()) {
      this.dontTrackAfk();
      this.startIdle();
      console.log('idle started manually');
    }
    console.log('session ended');
  },

  restartSession: function restartSession() {
    audio.stop();
    notify.closeAll();
    this.endSession();
    this.startSession();
  },

  startIdle: function startIdle(time) {
    var t = time || +this._idle.getPeriod();
    this._idle.setStatus('running');
    this._idle.setStartDate(Date.now());

    // Notify popup.
    router.send('idleStarted');
    this._idle.timeoutId = setTimeout(function () {
      self.endIdle();
      notify.idleEnded();
      audio.play(3);
    }, t);
    console.log('idle started');
  },

  endIdle: function endIdle() {
    clearTimeout(this._idle.timeoutId);
    this._idle.timeoutId = null;
    this._idle.resetStatus();
    this._idle.resetStartDate();

    // Notify popup.
    router.send('idleEnded');
    console.log('idle ended');
  },

  trackAfk: function trackAfk() {

    // Afk timer === idle.getPeriod();
    var t = this._idle.getPeriod();
    this._afk.startDate = Date.now();

    // Notify popup.
    router.send('afk', this._afk.startDate);
    this._afk.timeoutId = setTimeout(function () {
      self.dontTrackAfk();
      self.endSession();

      // Notify popup.
      router.send('sessionEnded');
      console.log('AFK session ended');
    }, t);

    console.log('AFK tracking...');
  },

  dontTrackAfk: function dontTrackAfk() {
    clearTimeout(this._afk.timeoutId);
    this._afk.timeoutId = null;
    this._afk.startDate = null;

    // Notify popup.
    router.send('notAfk');
    console.log('AFK stopped');
  },

  isAfk: function isAfk() {
    return !!this._afk.timeoutId;
  }
});


/** Help functions */

function extend(receiver, supplier) {
  Object.keys(supplier).forEach(function (property) {
    var descriptor = Object.getOwnPropertyDescriptor(supplier, property);
    Object.defineProperty(receiver, property, descriptor);
  });
  return receiver;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * Module exports
 */

module.exports = Engine;


