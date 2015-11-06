'use strict';

//todo timer doesn't work properly
var switcherBtn = document.getElementById('btn'),
  options = document.getElementById('options'),

  sessionInput = document.getElementById('session-input'),
  sessionInputBtn = document.getElementById('session-apply-btn'),
  sessionRestartBtn = document.getElementById('session-restart'),

  idleInput = document.getElementById('idle-input'),
  idleInputBtn = document.getElementById('idle-apply-btn'),
  afkIndicator = document.getElementById('afk'),

  soundsBtn = document.getElementById('sounds-btn'),

  // Init modules
  Router = require('./Router.js'),
  utils = require('./utils.js'),
  audio = require('./audio.js'),
  timer = require('./options_periods'),
  router = new Router('frontend');




  (function init() {
    var state = window.localStorage.getItem('state'),
      sessionPeriod = window.localStorage.getItem('session.period'),
      idlePeriod = window.localStorage.getItem('idle.period'),
      sounds = +window.localStorage.getItem('volume');

    if (state === 'on') {
      switcherBtn.classList.add('app-btn-active');
      timer.showSession();
    } else {
      switcherBtn.classList.remove('app-btn-active');
      options.classList.add('options-disabled');
    }


    if (!sounds) {
      soundsBtn.classList.add('disabled');
    } else {
      soundsBtn.classList.remove('disabled');
    }

    sessionInput.value = utils.ms2min(sessionPeriod);
    idleInput.value = utils.ms2min(idlePeriod);

  })();

  switcherBtn.addEventListener('click', function (e) {
    if (this.classList.contains('app-btn-active')) {

      this.classList.remove("app-btn-active");
      options.classList.add('options-disabled');
      router.send('setStateOff', null, function () {});

    } else {
      this.classList.add("app-btn-active");
      options.classList.remove('options-disabled');
      router.send('setStateOn', null, function () {});
    }

  });


  sessionRestartBtn.addEventListener('click', function () {
    timer.clearSession();
    router.send('restartSession', null, function (response) {
      timer.showSession(response);
    });
  });

  sessionInput.addEventListener('input', function (e) {
    sessionInputBtn.classList.remove('btn-hidden');
  });

  sessionInputBtn.addEventListener('click', function () {
    var value = +sessionInput.value,
      min = sessionInput.min,
      max = sessionInput.max;

    if (!value || value < 0) {
      sessionInput.value = min;
      return;
    }

    if (value < min) {
      sessionInput.value = value = min;
    }
    if (value > max) {
      sessionInput.value = value = max;
    }

    value = utils.min2ms(value);
    this.classList.add('btn-hidden');

    router.send('setSessionPeriod', value, function () {});

  });



  idleInput.addEventListener('input', function (e) {
    idleInputBtn.classList.remove('btn-hidden');
  });

  idleInputBtn.addEventListener('click', function () {
    var value = +idleInput.value,
      min = idleInput.min,
      max = idleInput.max;

    if (!value || value < 0) {
      idleInput.value = min;
      return;
    }

    if (value < min) {
      idleInput.value = value = min;
    }
    if (value > max) {
      idleInput.value = value = max;
    }

    value = utils.min2ms(value);
    this.classList.add('btn-hidden');

    router.send('setIdlePeriod', value, function () {});

  });



  soundsBtn.addEventListener('click', function (e) {
    var value = +window.localStorage.getItem('volume');
    if (!value) {
      router.send('unmute');
      this.classList.remove('disabled');
    } else {
      router.send('mute');
      this.classList.add('disabled');
    }


  });

  options.addEventListener('selectstart', function (e) {
    e.preventDefault();
  });



  router.on('sessionStarted', function () {
    timer.clearIdle();
    timer.clearSession();
    timer.showSession();
  });

  router.on('sessionEnded', function () {
    timer.clearSession();
  });


  router.on('idleStarted', function () {
    timer.clearSession();
    timer.clearIdle();
    timer.showIdle();
  });

  router.on('idleEnded', function () {
    timer.clearIdle();
  });


  router.on('idle', function () {
    afkIndicator.classList.add('shown');
  });

  router.on('active', function () {
    afkIndicator.classList.remove('shown');
  });


  router.on('afk', function (message) {
    timer.showIdle(message.value);
  });

  router.on('notAfk', function () {
    timer.clearIdle();
  });

