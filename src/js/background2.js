;
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

    // Define modules

    this.router = new SK.modules.Router('bg');

    SK.modules.badger(this);

    SK.modules.converter(this);

    this.notify = new SK.modules.Notify();

    SK.modules.audio(this);
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

  SK.modules.converter = function (app){
    app.ms2min = function (ms) {
      return Math.floor(ms / 60000);
    };

    app.min2ms = function (mins) {
      return mins * 60000;
    };
  };

  SK.modules.Notify = (function (global) {

    // Dependencies
    var converter = SK.modules.converter;

    console.info('Notify module');

    var _idleOptions = {
        body: 'Now you can get back to work',
        icon: '../img/eyes_good.png'
      },

      //
      _idleNotification;


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

    function _sessionEnd() {
      var options = {
        type: 'basic',

        iconUrl: '../img/eyes_tired2.png',

        title: 'Enough! ' + converter.ms2min(global.session.period.load()) + ' minutes have passed',

        message: 'Take a ' + converter.ms2min(global.idle.period.load()) + '-minute break',

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
    }

    function _idleEnd() {
      _idleNotification = new Notification('Time to break passed', _idleOptions);
    }

    function _closeIdleEnd() {
      _idleNotification.close();
    }

    function _idleProgress() {
      var options = {
        type: 'basic',

        iconUrl: '../img/eyes_tired.jpg',

        title: 'Idle time left :' + converter.ms2min(global.idle.period.load() - (Date.now() - global.idle.startDate.load())),

        message: 'Your eyes need to rest',

        contextMessage: 'Sight keeper',

        priority: 1,
      };
    }

    function Notify() {

      // Shows notification
      this.sessionEnd = _sessionEnd;

      // Show that user have enough rest, uses web Notification API
      this.idleEnd = _idleEnd;

      // Uses web Notification API
      this.closeIdleEnd = _closeIdleEnd;

      this.idleProgress = _idleProgress;
    }

    return Notify;
  })(SK);

  SK.modules.audio = function (app) {
    var audio = new Audio('audio/haze.ogg');
    console.log(document.body);
    app.audio = audio;
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
