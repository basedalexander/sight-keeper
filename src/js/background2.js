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

    this.startListenToIdleState = function () {
      console.log('added idle listener');
      chrome.idle.setDetectionInterval(15);
      chrome.idle.onStateChanged.addListener(this.idleHandler);
    };

    this.stopListenToIdleState = function () {
      console.log('idle listener removed');
      chrome.idle.onStateChanged.removeListener(this.idleHandler);
    };

    this.idleHandler = function (idleState) {
      console.log(idleState + ' fired');
      if (idleState === 'idle') {
        if (this.session.status.load() === 'running') {
          this.trackAfk();
        }
        if (this.session.status.load() === 'stopped' && this.idle.status.load() === 'stopped') {
          this.startIdle();
        }
      }

      if (idleState === 'active') {
        if (this.session.status.load() === 'running') {
          this.dontTrackAfk();
        }
        if (this.idle.status.load() === 'running') {
          this.notifIdleProgress();
        }
        if (this.idle.status.load() === 'stopped' && this.session.status.load() === 'stopped') {
          if (this.idleEndNotification) this.idleEndNotification.close();
          this.startSession();
        }
      }
    };



    if (this.state.load() === 'on') {
      this.turnOn();
    } else {
      this.turnOff();
    }
  };

  SK.prototype.turnOn = function () {
    console.log('app turned on');
    this.startSession();
    this.startListenToIdleState();
    this.enableIcon();
  };

  SK.prototype.turnOff = function () {
    console.log('app turned OFF');
    this.endSession();
    this.endIdle();
    this.notifyClearAll();
    this.audio.pause();
    this.stopListenToIdleState();
    this.state.save('off');
    this.disableIcon();
  };

  SK.prototype.startSession = function (time) {

    var session = this.session,
        self = this,
      t = time || +session.period.load();

    session.status.save('running');

    session.startDate.save(Date.now());

    session.timerId = setTimeout(function () {
      self.endSession();
      self.notifySessionEnd();
    }, t);
  };

  SK.prototype.endSession = function () {
    var session = this.session;
    console.log('session ended');

    clearTimeout(session.timerId);
    session.status.reset();

    session.startDate.reset();

    this.dontTrackAfk();
  };


  SK.prototype.startIdle = function (time) {
    console.log('idle started');

    var idle = this.idle,
      t = time || +idle.period.load();

    idle.status.save('running');
    idle.startDate.save(Date.now());

    idle.timerId = setTimeout(function () {
      this.endIdle();
      this.notifEndIdle();
    }, t);
  };

  SK.prototype.endIdle = function () {
    console.log('idle ended');
    var idle = this.idle;

    clearTimeout(idle.timerId);
    idle.status.reset();
    idle.startDate.reset();
  };

  SK.prototype.trackAfk = function () {
    console.log('tracking AFK...');
    this.afkId = setTimeout(function () {
      this.endSession();
    }, this.idle.period.load());
  };

  SK.prototype.dontTrackAfk = function () {
    console.log('stop tracking AFK');
    clearTimeout(this.afkId);
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
      return Math.floor(ms / 60000);
    };

    app.min2ms = function (mins) {
      return mins * 60000;
    };
  };

  // Desktop notifications (chrome.notifications API and
  // web Notifications API)
  SK.modules.notify = function (app) {

    // Dependencies
    var converter = SK.modules.converter;

    console.info('Notify module');

    app.idleOptions = {
      body: 'Now you can get back to work',
      icon: '../img/eyes_good.png'
    };

    //
    app.idleNotification = null;


    // Listen to click event on notification's buttons
    function _buttonHandler(id, buttonIndex) {

      // When pressed 'SKIP' button - run session again
      if (buttonIndex === 0) {
        chrome.notifications.clear(id, function () {
          startSession();
          console.log('idle skipped');
        });
      } else {

        // When pressed 'remind in *' run session with time : '5 minutes'
        chrome.notifications.clear(id, function () {
          startSession(min2ms(5));
          console.log('set reminder after 5 mins');
        });
      }

      // remove listener after button pressed
      chrome.notifications.onButtonClicked.removeListener(buttonHandler);
    }

    app.notifySessionEnd = function () {
      var options = {
        type: 'basic',

        iconUrl: '../img/eyes_tired2.png',

        title: 'Enough! ' + this.ms2min(this.session.period.load()) + ' minutes have passed',

        message: 'Take a ' + this.ms2min(this.idle.period.load()) + '-minute break',

        contextMessage: 'Sight keeper',

        priority: 2,

        buttons: [{
          title: 'SKIP',
          iconUrl: '../img/ignore_ico.jpg'
        }, {
          title: 'remind in 5 minutes',
          iconUrl: '../img/remind_ico.jpg'
        }]
      };
      chrome.notifications.create('sessionEnd', options, function (id) {

        // Adding listener to buttons in notification
        chrome.notifications.onButtonClicked.addListener(_buttonHandler);

        setTimeout(function () {

          // remove button listeners for a case
          chrome.notifications.onButtonClicked.removeListener(_buttonHandler);

          // then clear notification
          chrome.notifications.clear(id, function () {});
        }, 15000);
      });
    };

    app.notifyIdleEnd = function () {
      this.idleNotification = new Notification('Time to break passed', this.idleOptions);
    };

    app.notifyCloseIdleEnd = function () {
      if (this.idleNotification) this.idleNotification.close();
    };

    app.notifyIdleProgress = function () {
      var options = {
        type: 'basic',

        iconUrl: '../img/eyes_tired.jpg',

        title: 'Idle time left :' + this.ms2min(this.idle.period.load() - (Date.now() - this.idle.startDate.load())),

        message: 'Your eyes need to rest',

        contextMessage: 'Sight keeper',

        priority: 2,
      };

      chrome.notifications.create('idleProgress', options, function (id) {
        setTimeout(function () {
          chrome.notifications.clear(id, function () {});
        }, 5000);
      });
    };

    app.notifyClearAll = function () {
      chrome.notifications.clear('sessionEnd', function () {});
      chrome.notifications.clear('idleProgress', function () {});
      this.notifyCloseIdleEnd();
    };
  };

  // Audio notifications
  SK.modules.audio = function (app) {
    console.info('audio module');
    app.audio = new Audio('audio/haze.ogg');
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
