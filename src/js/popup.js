(function (window, document) {
  'use strict';
  var SK = function () {
    var switcherBtn = document.getElementById('btn'),
      sessionInput = document.getElementById('session-input'),
      idleInput = document.getElementById('idle-input'),
      sessionInputBtn = document.getElementById('session-apply-btn'),
      idleInputBtn = document.getElementById('idle-apply-btn'),
      sessionRestartBtn = document.getElementById('session-restart'),
      idleRestartBtn = document.getElementById('idle-restart'),
      options = document.getElementById('options'),



      // Init modules
      router = new SK.modules.Router('fr'),
      utils = new SK.modules.Utils(),
      audio = new SK.modules.Audio(),
      timer = new SK.modules.Timer();

      (function init() {
        var state = localStorage.getItem('state'),
          sessionPeriod = localStorage.getItem('session.period'),
          idlePeriod = localStorage.getItem('idle.period');

        if (state === 'on') {
          switcherBtn.classList.add('btn-active');
          timer.showSession();
         } else {
          switcherBtn.classList.remove('btn-active');
          options.classList.add('options-disabled');
        }

        sessionInput.value = utils.ms2min(sessionPeriod);
        idleInput.value = utils.ms2min(idlePeriod);

      })();

    switcherBtn.addEventListener('click', function(e) {
        if (this.classList.contains('btn-active')) {

          this.classList.remove("btn-active");
          options.classList.add('options-disabled');
          router.send('state', 'off' , function () {} );

        } else {
          this.classList.add("btn-active");
          options.classList.remove('options-disabled');
          router.send('state', 'on' , function () {
          } );
        }

      });

    sessionRestartBtn.addEventListener('click', function () {
        timer.restartSession();

        chrome.runtime.sendMessage({
          id: 'popup',
          name: 'sessionRestart',
          value: '.'
        }, function (answer) {
          timer.showSession();
        });
      });

    sessionInput.addEventListener('input', function (e) {
        sessionInputBtn.classList.remove('btn-hidden');
      });

    sessionInputBtn.addEventListener('click', function () {
        var value = +sessionInput.value,
            min = sessionInput.min,
            max = sessionInput.max;

        if (!value) {
          sessionInput.value = min;
          return;
        }

        if (value < min) {sessionInput.value = value = min; }
        if (value > max) { sessionInput.value = value = max; }

        value = utils.min2ms(value);
        this.classList.add('btn-hidden');

        router.send('session.period', value, function () {
        });

      });

    idleInput.addEventListener('input', function (e) {
      idleInputBtn.classList.remove('btn-hidden');
    });

    idleInputBtn.addEventListener('click', function () {
      var value = utils.min2ms(idleInput.value);
      this.classList.add('btn-hidden');

      router.send('idle.period', value, function () {
      });

    });

    router.on('sessionStarted', function () {
        timer.clearIdle();
        timer.clearSession();
        timer.showSession();
      });

    router.on('sessionEnded', function () {
        timer.clearIdle();
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
  };


  SK.modules = {};

  // Creates an object that has methods for retrieving and
  // setting value in localStorage to given key.

  SK.modules.Router = function (identifier) {

    // Unique identifier for current script
    var id = identifier;

    function send (name, value, cb) {

      // @link https://developer.chrome.com/extensions/runtime#method-sendMessage
      chrome.runtime.sendMessage({
          id: id,
          name: name,
          value: value
        },
      cb);
    }

    function on (name, handler) {

      // Save handler in router object.
      this[name] = function (message, sender, cb) {

        // If message was send from another Router instance or
        // message name is not what we expecting then do nothing.
        if (message.id !== id && message.name === name) {

          // Handle message
          cb(handler(message));
        }
      };

      // @link https://developer.chrome.com/extensions/runtime#event-onMessage
      chrome.runtime.onMessage.addListener(this[name]);
    }

    this.send = send;
    this.on = on;
  };

  SK.modules.Utils = function () {
    console.info('converter module');

    this.ms2min = function (ms) {
      return +(ms / 60000).toFixed(1);
    };

    this.min2ms = function (mins) {
      return mins * 60000;
    };

    this.sec2ms = function (sec) {
      return sec * 1000;
    };

    this.ms2sec = function (ms) {
      return ms / 1000;
    };
  };

  // Desktop notifications (chrome.notifications API and
  // web Notifications API)

  // Audio notifications
  SK.modules.Audio = function () {
    console.info('audio module');

    // dependency
    var Static = SK.modules.Static,
      audio = new Audio('');

    // Plays audio file with given index,
    // get's volume from localStorage (user preference)
    function play (index) {
      audio.src = 'audio/' + index + '.ogg';
      audio.play();
    }

    function stop () {
      audio.src = '';
    }

    document.body.appendChild(audio);

    this.play = play;
    this.stop = stop;
  };

  SK.modules.Timer = function () {
    var sessionTimer = document.getElementById('session-timer'),
      idleTimer = document.getElementById('idle-timer'),
      intervalId,
      diff,
      mins,
      secs;


    function showSession () {
      var time = +localStorage.getItem('session.startDate');
      if (!time) { return; }

      sessionTimer.innerHTML = printTime(time);

      intervalId = setInterval(function () {
        sessionTimer.innerHTML = printTime(time);
      }, 1000);
    }

    function clearSession () {
      clearInterval(intervalId);
      sessionTimer.innerHTML = '00:00';
    }

    function restartSession () {
      clearSession();
      showSession();
    }


    function showIdle () {
      var time = +localStorage.getItem('idle.startDate');
      if (!time) { return; }

      idleTimer.innerHTML = printTime(time);

      intervalId = setInterval(function () {
        idleTimer.innerHTML = printTime(time);
      }, 1000);
    }


    function clearIdle () {
      clearInterval(intervalId);
      idleTimer.innerHTML = '00:00';
    }


    function restartIdle () {
      clearIdle();
      showIdle();
    }

    function printTime (time) {
      diff = new Date(Date.now() - time);

      mins = diff.getMinutes();
      if (mins < 10) { mins = '0' + mins; }
      secs = diff.getSeconds();
      if (secs < 10) { secs = '0' + secs; }

      return mins + ':' + secs;
    }

    this.showSession = showSession;
    this.clearSession = clearSession;
    this.showIdle = showIdle;
    this.clearIdle = clearIdle;
    this.restartSession = restartSession;
    this.restartIdle = restartIdle;
  };


  window.sk = new SK();
})(window, window.document);

