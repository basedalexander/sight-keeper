(function (window, document) {
  'use strict';
  var SK = function () {

    var self = this;

    // Main state of the application
    // it could be either 'on' or 'off',
    // the user could manage it in popup
    this.state = new SK.modules.Static('state', 'on');

    this.session = {

      // Status of session period
      // it could be 'running' and 'stopped'
      status: new SK.modules.Static('session.status', 'stopped'),

      // Configurable in popup options
      period: new SK.modules.Static('session.period', '60000'), //2700000 45min

      startDate: new SK.modules.Static('session.startDate', '0')

    };

    this.idle = {

      // Status of idle period
      // it could be 'running' and 'stopped'
      status: new SK.modules.Static('idle.status', 'stopped'),

      // Configurable in popup options
      period: new SK.modules.Static('idle.period', '30000'), // 300000 5min

      startDate: new SK.modules.Static('idle.startDate', '0')
    };


    // Idle detection interval for session period in seconds.
    this.session.idleDetect = 160;

    // Idle detection interval for idle period in seconds.
    this.idle.idleDetect = 15;

    // Object for tracking afk state
    this.afk = {
      timeoutId: null,
      startDate: null
    };

    // Initially reset these values
    this.session.status.reset();
    this.session.startDate.reset();
    this.idle.status.reset();
    this.idle.startDate.reset();


    // Init modules
    this.router = new SK.modules.Router('bg');
    SK.modules.badger(this);
    SK.modules.converter(this);
    SK.modules.notify(this);
    SK.modules.audio(this);


    // Basic functionality

    // Starts session period
    this.startSession = function (time) {
      var t = time || +this.session.period.load(),
        self = this;

      self.session.status.save('running');
      self.session.startDate.save(Date.now());

      // Set interval for session period
      chrome.idle.setDetectionInterval(self.session.idleDetect);

      self.session.timerId = setTimeout(function () {
        self.endSession();
        console.log('session ended');

        self.notifySessionEnd();
        self.playSound(1);
      }, t);
    };

    // It called when session period elapsed
    this.endSession = function () {
      var s = this.session,
          now = Date.now();

      // For cases when user was idling (was called this.trackAfk)
      clearTimeout(s.timerId);
      s.timerId = null;

      // Sets session status to default ('stopped')
      s.status.reset();

      // Sets session startDate to default ('0')
      s.startDate.reset();

      // If session period successfully ended
      chrome.idle.setDetectionInterval(60); // 150

      // If session period finished while user is still afk - run idle
      // manually
      // @link https://developer.chrome.com/extensions/idle#method-queryState
      if (this.afk.timeoutId) {
        var period = +this.idle.period.load();
        var t = now - this.afk.startDate;


        this.startIdle(period - t);
        console.log('idle started , custom period : ' + (period - t));


        // It simple clears afk timerId.
        this.dontTrackAfk();
        console.log('stop tracking AFK by endSession');
      }
    };

    // Starts idle period
    this.startIdle = function (time) {
      var i = this.idle,
        t = time || +i.period.load(),
        self = this;

      i.status.save('running');
      i.startDate.save(Date.now());

      chrome.idle.setDetectionInterval(this.idle.idleDetect);

      i.timerId = setTimeout(function () {
        self.endIdle();
        console.log('idle ended');


        self.notifyIdleEnd();
        self.playSound(3);
      }, t);
    };

    this.endIdle = function () {
      var idle = this.idle;

      clearTimeout(idle.timerId);
      idle.timerId = null;

      idle.status.reset();
      idle.startDate.reset();

      // Delete value due to idle endings
      idle.timeLeft = null;
    };

    this.restartIdle = function () {
      var i = this.idle;

      clearTimeout(i.timerId);

      this.startIdle();
    };

    // When user interupts idle period -
    // pause idle and notify user that period isn't finished yet.
    this.pauseIdle = function () {

      clearTimeout(this.idle.timerId);
      this.idle.timerId = null;

      var period = this.idle.timeLeft || this.idle.period.load();
      var now = Date.now();
      var startDate = this.idle.startDate.load();


      this.idle.timeLeft = period - (now - startDate);

      this.idle.status.save('paused');

    };

    this.trackAfk = function () {
      var self = this,
        t = self.idle.period.load();

      self.afk.startDate = Date.now();

      self.afk.timeoutId = setTimeout(function () {
        self.dontTrackAfk();
        self.endSession();
        console.log('session ended by AFK tracker');
      }, t);
    };

    this.dontTrackAfk = function () {

      clearTimeout(this.afk.timeoutId);

      this.afk.timeoutId = null;

      this.afk.startDate = null;
    };


    //Checks 'state' value  when app has been loaded,
    // and does things depending on received value.
    // todo untested
    this.checkState = function () {
     var state = this.state.load();

      // If app is on , then run it.
      if (state === 'on') {
        this.enableIcon();
        this.switchOn();

        // If it is 'off' then just change browserAction
      } else {
        this.disableIcon();
        this.switchOff();
      }

    };

    this.switchOn = function () {
      console.info('switched ON');

      this.addIdleListener();

      this.addBtnListener();

      this.startSession();

      console.log('session started , period : ' + this.session.period.load());

      this.enableIcon();
    };

    this.switchOff = function () {
      console.log('SK is OFF');

      this.state.save('off');

      if (this.afk.timeoutId) {
        this.dontTrackAfk();
      }

      this.endSession();

      this.endIdle();

      this.rmIdleListener();

      this.rmBtnListener();

      this.disableIcon();

      this.stopSound();

      this.notifyCloseAll();
    };

    // Chrome idle state listener
    // @link https://developer.chrome.com/extensions/idle
    this.idleListener = function (idleState) {
      console.log(idleState + ' fired');

      var idleStatus = self.idle.status,
          sessionStatus = self.session.status;

      // If app state is 'off' - ignore
      if (self.state.load() === 'off') {
        return;
      }

      // Idle state fired!
      if (idleState === 'idle') {

        // If session is running and user goes afk ,
        // start countdown certain amount of time, after witch
        // app assumes that user have rested.
        if (sessionStatus.load() === 'running') {
          self.trackAfk();
          console.log('tracking AFK...');
        }

        // If session time elapsed and user doesn't do any inputs - start
        // idle period.
        if (sessionStatus.load() === 'stopped' && self.idle.status.load() === 'stopped') {
          self.startIdle();
          console.log('idle started , period : ' + self.idle.period.load());
        }

        if (idleStatus.load() === 'paused') {

          self.restartIdle();
          console.log('idle restarted');

          //self.unpauseIdle();
          //console.log('idle continued, time left : ' + self.idle.timeLeft);
        }
      }

      // Active state fired!
      if (idleState === 'active') {

        // If user was afk while session was running -
        // stop countdown afk time.
        if (sessionStatus.load() === 'running') {
          self.dontTrackAfk();
          console.log('stop tracking AFK');
        }

        // If idle period is running and user have made an input -
        // notify user that idle period is not finished yet.
        if (idleStatus.load() === 'running') {
          //self.restartIdle();

          self.pauseIdle();
          self.notifyIdlePaused();
          self.playSound(2);

          console.log('idle paused');
        }

        // If idle period finished and user makes an input -
        // start session period and close desktop notification
        // 'idle finished'.
        if (idleStatus.load() === 'stopped' && sessionStatus.load() === 'stopped') {
          if (self.idleEndNotification) {
            self.idleEndNotification.close();
          }

          self.startSession();
          console.log('session started since did input, period : ' + self.session.period.load());

          self.closeIdleEnd();
        }
      }
    };

    this.addIdleListener = function () {
      chrome.idle.onStateChanged.addListener(self.idleListener);

      console.log('idle listener added');
    };

    this.rmIdleListener = function () {
      chrome.idle.onStateChanged.removeListener(self.idleListener);

      console.log('idle listener removed');
    };


    // Chrome notification button's handler
    // @link https://developer.chrome.com/apps/notifications#event-onButtonClicked
    this.btnListener = function (id, buttonIndex) {
      chrome.notifications.clear(id, function () {});
      if (id === 'sessionEnd') {

        if (buttonIndex === 0) {
          self.startSession();
          console.log('session started by skipping idle , period : ' + self.ms2min(self.session.period.load()) + ' min');
        } else {
          self.startSession(5 * 60000);
          console.log('session started , reminder, period : ' + self.ms2min(5 * 60000) + ' min');
        }
      }

      if (id === 'idlePaused') {

        if (buttonIndex === 0) {

          self.idle.timerId = null;

          self.idle.status.reset();
          self.idle.startDate.reset();

          self.startSession();
        }
      }
    };

    this.addBtnListener = function () {
      chrome.notifications.onButtonClicked.addListener(self.btnListener);

      console.log('btn listener added');
    };

    this.rmBtnListener = function () {
      chrome.notifications.onButtonClicked.removeListener(self.btnListener);

      console.log('btn listener removed');
    };


    // Listen to change of 'state' value from popup.js
    this.router.on('state', function (message) {

      // Set this value to localStorage
      localStorage.setItem(message.name, message.value);

      // Then execute the main function
      self.checkState();
    }
    );


    this.checkState();
  };


  SK.modules = {};

  // Creates an object that has methods for retrieving and
  // setting value in localStorage to given key.
  SK.modules.Static = (function () {
    console.info('Static module');

    function Static(name, defaultValue) {

      // Key for localStorage
      this.name = name;

      // Default value for cases when there are some problems with
      // retrieving of value from localStorage
      // or just for reset purposes.
      this.defaultValue = defaultValue;

      // Initially load value from localStorage
      this.load();
    }

    _createClass(Static, {

      // Sets value to defaultValue and returns it
      reset: {
        value: function reset() {
          return this.save(this.defaultValue);
        }
      },

      // Loads value from localStorage and returns it,
      // If there are problems - calls reset method.
      load: {
        value: function load() {
          var value = window.localStorage.getItem(this.name);

          // If value successfuly retrieved - return it
          if (value !== null) {
            return value;
          }

          // Otherwise reset it to defaultValue
          console.log("can't obtain the value ", this.name, 'reset to default value');

          return this.reset();
        }
      },

      // Sets value and returns it
      save: {
        value: function save(value) {
          window.localStorage.setItem(this.name, value);

          return this.load();
        }
      }
    });

    // return class
    return Static;
  })();

  // Creates an object that can:
  //
  // *  Add listeners for handling
  //    particular messages that arrive from another scripts
  //    within extention.
  //
  // *  Send messages throughout the extention.
  SK.modules.Router = (function () {
    console.info('Router module');

    function Router(id) {

      // Unique identifier for current script
      this.id = id;
    }

    _createClass(Router, {

      // Sends the message throughout the extention
      send: {
        value: function send(name, value, cb) {

          // @link https://developer.chrome.com/extensions/runtime#method-sendMessage
          chrome.runtime.sendMessage({
              id: this.id,

              name: name,

              value: value
            },
            cb);
        }
      },

      // Adds listener for particular message that was
      // sent from anotherscript within the extention
      on: {
        value: function on(name, handler) {
          var self = this;

            // Save handler in router object.
            self[name] = function (message, sender, cb) {

              // If message was send from another Router instance or
              // message name is not what we expecting then do nothing.
              if (message.id !== self.id && message.name === name) {

                // Handle message
                handler(message);
              }

            };

          // @link https://developer.chrome.com/extensions/runtime#event-onMessage
          chrome.runtime.onMessage.addListener(self[name]);
        }
      }
    });

    // return class
    return Router;
  })();

  SK.modules.badger = function (app) {
    console.info('badger module');

    // @link https://developer.chrome.com/extensions/browserAction#method-setIcon
    app.disableIcon = function () {
      chrome.browserAction.setIcon({
        path: '../img/popup-icon-off-19.png'
      }, function () {});
    };

    app.enableIcon = function () {
      chrome.browserAction.setIcon({
        path: '../img/popup-icon-on-19.png'
      }, function () {});
    };
  };

  SK.modules.converter = function (app) {
    console.info('converter module');

    app.ms2min = function (ms) {
      return +(ms / 60000).toFixed(1);
    };

    app.min2ms = function (mins) {
      return mins * 60000;
    };

    app.sec2ms = function (sec) {
      return sec * 1000;
    };

    app.ms2sec = function (ms) {
      return ms / 1000;
    };
  };

  // Desktop notifications (chrome.notifications API and
  // web Notifications API)
  SK.modules.notify = function (app) {
    console.info('Notify module');




    app.notifySessionEnd = function () {
      var options = {
          type: 'basic',
          iconUrl: '../img/eyes_tired2.png',
          title: 'You are working ' + this.ms2min(this.session.period.load()) + ' minutes',
          message: 'Take a break from the monitor' + this.ms2min(this.idle.period.load()) + ' minutes, will remind you in 1 minute if you will ignore this',
          contextMessage: 'Sight keeper',
          priority: 2,
          buttons: [{
            title: 'SKIP',
            iconUrl: '../img/ignore_ico.jpg'
          }, {
            title: 'Remind in 5 minutes',
            iconUrl: '../img/remind_ico.jpg'
          }]
        };


      // @link https://developer.chrome.com/apps/notifications#method-create
      chrome.notifications.create('sessionEnd', options, function (id) {

        setTimeout(function () {

          // @link https://developer.chrome.com/apps/notifications#method-clear
          chrome.notifications.clear(id, function () {});

        }, 23000);
      });
    };

    // Notifies that idle session is ended,
    // notification showed untill user make any imput.
    // @link https://developer.mozilla.org/en-US/docs/Web/API/notification
    app.notifyIdleEnd = function () {
      this.notificationIdleEnd = new Notification('IDLE ENDED', {
        body: 'You can work',
        icon: '../img/eyes_good.png'
      });
    };

    app.closeIdleEnd = function () {
      if (this.notificationIdleEnd) {
        this.notificationIdleEnd.close();
        this.notificationIdleEnd = null;
      }
    };

    app.notifyIdlePaused = function () {
      var total = this.ms2min(this.idle.period.load()),

        elapsed = this.ms2min(this.idle.period.load() - this.idle.timeLeft),

        options = {
          type: 'basic',
          iconUrl: '../img/!.png',
          title: 'Restarting idle..',
          message: 'Don\'t touch PC untill the idle end',
          contextMessage: 'Sight keeper',
          priority: 2,
          buttons: [{
            title: 'SKIP idle',
            iconUrl: '../img/ignore_ico.jpg'
          }]
        };

      // @link https://developer.chrome.com/apps/notifications#method-create
      chrome.notifications.create('idlePaused', options, function (id) {

        setTimeout(function () {

          // @link https://developer.chrome.com/apps/notifications#method-clear
          chrome.notifications.clear(id, function () {});
        }, 23000);
      });
    };

    app.notifyCloseAll = function () {
      chrome.notifications.clear('sessionEnd', function () {});
      chrome.notifications.clear('idleProgress', function () {});
      chrome.notifications.clear('idlePaused', function () {});
      this.closeIdleEnd();
    };
  };

  // Audio notifications
  SK.modules.audio = function (app) {
    console.info('audio module');

    // dependency
    var Static = SK.modules.Static;

    app.audio = new window.Audio('');
    app.volumeStatic = new Static('volume', '1');

    // Play audio file with given index,
    // get's volume from localStorage (user preference)
    app.playSound = function (index) {
      app.audio.src = 'audio/' + index + '.ogg';
      app.audio.volume = app.volumeStatic.load();
      app.audio.play();
    };

    app.stopSound = function () {
      app.audio.src = '';
    };



    document.body.appendChild(app.audio);
  };


  // Miscellaneous functions
  function _createClass(target, props) {

    for (var key in props) {

      var prop = props[key];

      // @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties
      prop.configurable = true;

      prop.writable = true;
    }

    Object.defineProperties(target.prototype, props);
  }






  window.SK = new SK();
})(window, window.document);

console.info('WINDOW IS ' + typeof window);
