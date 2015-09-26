(function (window, document) {
  'use strict';
  var SK = function () {

    // Main state of the application
    // it could be either 'on' or 'off',
    // the user could manage it in popup
    this.state = new SK.modules.Static('state', 'on');


    this.session = {

      // Status of session period
      // it could be 'running' and 'stopped'
      status: new SK.modules.Static('session.status', 'stopped'),

      // Configurable in popup options
      period: new SK.modules.Static('session.period', '2700000'), //2700000 45min

      startDate: new SK.modules.Static('session.startDate', '0'),
    };

    this.idle = {

      // Status of idle period
      // it could be 'running' and 'stopped'
      status: new SK.modules.Static('idle.status', 'stopped'),

      // Configurable in popup options
      period: new SK.modules.Static('idle.period', '300000'), // 300000 5min

      startDate: new SK.modules.Static('idle.startDate', '0'),
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
    this.startSession = function () {
      console.log('session started');

      var t = +this.session.period.load(),
        self = this,
        s = this.session;

      s.status.save('running');

      s.startDate.save(Date.now());

      s.timerId = setTimeout(function () {
        self.endSession();
      }, t);
    };

    // It called when session period elapsed
    this.endSession = function () {
      console.log('session ended');
      var s = this.session;

      // For cases when user was idling (was called this.trackAfk)
      clearTimeout(s.timerId);
      s.timerId = null;

      // Sets session status to default ('stopped')
      s.status.reset();

      // Sets session startDate to default ('0')
      s.startDate.reset();

      // Just in case if user was afk less than idle.period time.
      // It simple clears afk timerId.
      this.dontTrackAfk();

      this.notifySessionEnd();
    };

    // Starts idle period
    this.startIdle = function () {
      console.log('idle started');

      var i = this.idle,
        t = +i.period.load(),
        self = this;

      i.status.save('running');
      i.startDate.save(Date.now());

      i.timerId = setTimeout(function () {
        self.endIdle();
      }, t);
    };

    this.endIdle = function () {
      console.log('idle ended');
      var idle = this.idle;

      clearTimeout(idle.timerId);
      idle.timerId = null;

      idle.status.reset();
      idle.startDate.reset();

      this.notifyIdleEnd();

    };

    this.trackAfk = function () {
      console.log('tracking AFK...');

      var self = this;

      this.afkId = setTimeout(function () {
        self.endSession();
      }, this.idle.period.load());
    };

    this.dontTrackAfk = function () {
      console.log('stop tracking AFK');
      clearTimeout(this.afkId);
      this.afkId = null;
    };


    // Called when app first loaded
    this.switcher = function () {
      if (this.state.load() === 'on') {
        this.switchOn();
      }
    };

    this.switchOn = function () {
      console.log('SK is ON');

      this.startSession();
      this.startListenToIdleState();
      this.enableIcon();
    };

    this.switchOff = function () {
      console.log('SK is OFF');

      this.endSession();
      this.endIdle();
      this.stopListenToIdleState();
      this.disableIcon();
      this.stopSound();
      this.notifyCloseAll();
    };

    this.startListenToIdleState = function () {
      console.log('added idle listener');
      var self = this;

      chrome.idle.setDetectionInterval(15);
      chrome.idle.onStateChanged.addListener(self.idleStateHandler);
    };

    this.stopListenToIdleState = function () {
      console.log('idle listener removed');

      var self = this;

      chrome.idle.onStateChanged.removeListener(self.idleStateHandler);
    };


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
          var value = localStorage.getItem(this.name);

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
          localStorage.setItem(this.name, value);

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

          // @link https://developer.chrome.com/extensions/runtime#event-onMessage
          chrome.runtime.onMessage.addListener(function (message, sender, cb) {

            // Don't do anything since the message was sent from the same Router
            if (message.id === self.id) return;

            // Message's name is not what we are listening to
            if (message.name !== name) return;

            // Handle message
            handler(message);
          });
        }
      }
    });

    // return class
    return Router;
  })();

  SK.modules.badger = function (app) {

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
  };

  // Desktop notifications (chrome.notifications API and
  // web Notifications API)
  SK.modules.notify = function (app) {
    console.info('Notify module');

    app.notifySessionEnd = function () {
      var options = {
        type: 'basic',
        iconUrl: '../img/eyes_tired2.png',
        title: 'Enough! ' + this.ms2min(this.session.period.load()) + ' minutes have passed',
        message: 'Take a ' + this.ms2min(this.idle.period.load()) + '-minute break',
        contextMessage: 'Sight keeper',
        priority: 2,
      };

      // @link https://developer.chrome.com/apps/notifications#method-create
      chrome.notifications.create('sessionEnd', options, function (id) {

        setTimeout(function () {

          // @link https://developer.chrome.com/apps/notifications#method-clear
          chrome.notifications.clear(id, function () {});
        }, 15000);
      });
    };

    // Notifies that idle session is ended,
    // notification showed untill user make any imput.
    // @link https://developer.mozilla.org/en-US/docs/Web/API/notification
    app.notifyIdleEnd = function () {
      this.notificationIdleEnd = new Notification('Time to break passed', {
        body: 'Now you can get back to work',
        icon: '../img/eyes_good.png'
      });
    };

    app.closeIdleEnd = function () {
      if (this.notificationIdleEnd) {
        this.notificationIdleEnd.close();
        delete this.notificationIdleEnd;
      }
    };

    app.notifyCloseAll = function () {
      chrome.notifications.clear('sessionEnd', function () {});
      chrome.notifications.clear('idleProgress', function () {});
      this.closeIdleEnd();
    };
  };

  // Audio notifications
  SK.modules.audio = function (app) {
    console.info('audio module');

    // dependency
    var Static = SK.modules.Static;

    app.audio = new Audio('');
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
