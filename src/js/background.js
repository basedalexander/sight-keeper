// TODO :
//  restart idle
//  hardcode at btnlistener


(function (window, document) {
  'use strict';
  var SK = function () {

    var Static = SK.modules.Static,
      router = new SK.modules.Router('bg'),
      badger = new SK.modules.Badger(),
      utils = new SK.modules.Utils(),
      notify = new SK.modules.Notify(),
      audio = new SK.modules.Audio(),

      // Main state of the application
      // it could be either 'on' or 'off',
      // the user could manage it in popup
      state = new Static('state', 'on'),

      session = {

        // Status of session period
        // it could be 'running' and 'stopped'
        status: new Static('session.status', 'stopped'),

        // Configurable in popup options
        period: new Static('session.period', '2700000'), //2700000 45min
        startDate: new Static('session.startDate', '0'),
      },

      idle = {

        // Status of idle period
        // it could be 'running' and 'stopped'
        status: new Static('idle.status', 'stopped'),

        // Configurable in popup options
        period: new Static('idle.period', '300000'), // 300000 5min

        startDate: new Static('idle.startDate', '0'),
      },

      // Object for tracking afk state
      afk = {
        timeoutId: null,
        startDate: null
      };

    // Initially reset these values
    session.status.reset();
    session.startDate.reset();
    idle.status.reset();
    idle.startDate.reset();

    chrome.idle.setDetectionInterval(15);

    router.on('state', function (message) {
        // Set this value to localStorage
        localStorage.setItem(message.name, message.value);

        // Then execute the main function
        switcher();
      }
    );


    // Basic functionality

    //Checks 'state' value  when app has been loaded,
    // and does things depending on received value.
    // todo untested
    function switcher () {

      // If app is on , then run it.
      if (state.load() === 'on') {
        switchOn();
      } else {

        // If it is 'off' then just change browserAction
        switchOff();
      }
    }

    function switchOn () {
      console.info('switched ON');

      addIdleListener();
      addBtnListener();
      startSession();
      badger.enableIcon();

      console.log('session started , period : ' + session.period.load());
    }

    function switchOff () {
      console.log('SK is OFF');

      state.save('off');

      if (afk.timeoutId) {
        dontTrackAfk();
      }

      endSession();
      endIdle();
      rmIdleListener();
      rmBtnListener();
      badger.disableIcon();
      audio.stop();
      notify.closeAll();
    }

    // Main logic of application
    // Chrome idle state listener
    // @link https://developer.chrome.com/extensions/idle
    function idleListener (idleState) {
      console.log(idleState + ' fired');

      var idleStatus = idle.status.load(),
        sessionStatus = session.status.load();

      // If app state is 'off' - ignore
      if (state.load() === 'off') {
        return;
      }

      // IDLE state fired!
      if (idleState === 'idle') {

        // If session is running and user goes afk ,
        // start countdown certain amount of time, after witch
        // app assumes that user have rested.
        if (sessionStatus === 'running') {
          trackAfk();
          console.log('tracking AFK...');
        }

        // If session time elapsed and user doesn't do any inputs - start
        // idle period.
        if (sessionStatus === 'stopped' && idleStatus === 'stopped') {
          startIdle();
          console.log('idle started , period : ' + idle.period.load());
        }

        if (idleStatus === 'paused') {
          startIdle();
        }
      }


      // ACTIVE state fired!
      if (idleState === 'active') {

        // If user was afk while session was running -
        // stop countdown afk time.
        if (sessionStatus === 'running') {
          dontTrackAfk();
          console.log('stop tracking AFK');
        }

        // If idle period is running and user have made an input -
        // notify user that idle period is not finished yet.
        if (idleStatus === 'running') {
          pauseIdle();
          notify.idleInterrupted();
          audio.play(1);
        }

        // If idle period finished and user makes an input -
        // start session period and close desktop notification
        // 'idle finished'.
        if (idleStatus === 'stopped' && sessionStatus === 'stopped') {
          notify.closeIdleEnded();
          startSession();
          console.log('session started since did input');
        }
      }
    }

    function addIdleListener () {
      chrome.idle.onStateChanged.addListener(idleListener);
      console.log('idle listener added');
    }

    function rmIdleListener () {
      chrome.idle.onStateChanged.removeListener(idleListener);
      console.log('idle listener removed');
    }


    // Chrome notification button's handler
    // @link https://developer.chrome.com/apps/notifications#event-onButtonClicked
    function btnListener (id, buttonIndex) {

      // Close notification when user clicks any button
      chrome.notifications.clear(id, function () {});

      if (id === 'sessionEnd') {

        if (buttonIndex === 0) {
          startSession();
          console.log('session started by skipping idle , period : ' + utils.ms2min(session.period.load()) + ' min');
        } else {

          // TODO make this value configurable.
          // get rid of hardcode
          startSession(5 * 60000);
          console.log('session started , reminder, period : ' + utils.ms2min(5 * 60000) + ' min');
        }
      }

      if (id === 'idleInterrupted') {

        if (buttonIndex === 0) {
          endIdle();
          startSession();
        }
      }
    }

    function addBtnListener () {
      chrome.notifications.onButtonClicked.addListener(btnListener);
      console.log('btn listener added');
    }

    function rmBtnListener () {
      chrome.notifications.onButtonClicked.removeListener(btnListener);
      console.log('btn listener removed');
    }

    // Starts session period
    function startSession (time) {
      var t = time || +session.period.load();

      session.status.save('running');
      session.startDate.save(Date.now());

      session.timerId = setTimeout(function () {
        endSession();

        if (!afk.timeoutId) {
          notify.sessionEnded();
          audio.play(1);
        }

        console.log('session ended');
      }, t);
    }

    // It called when session period elapsed
    function endSession () {

      // For cases when user was idling (was called trackAfk())
      clearTimeout(session.timerId);
      session.timerId = null;

      // Sets session status to default ('stopped')
      session.status.reset();

      // Sets session startDate to default ('0')
      session.startDate.reset();

      // If session period finished while user is still afk - run idle
      // manually
      // @link https://developer.chrome.com/extensions/idle#method-queryState
      if (afk.timeoutId) {
        startIdle();
        console.log('idle started manually');
        dontTrackAfk();
      }
    }

    // Starts idle period
    function startIdle(time) {
      var t = time || +idle.period.load();

      idle.status.save('running');
      idle.startDate.save(Date.now());

      idle.timerId = setTimeout(function () {
        endIdle();
        console.log('idle ended');

        notify.idleEnded();
        audio.play(3);
      }, t);
    }

    function endIdle () {

      clearTimeout(idle.timerId);
      idle.timerId = null;

      idle.status.reset();
      idle.startDate.reset();

      // Delete value due to idle endings
      idle.timeLeft = null;
    }

    function pauseIdle () {
      endIdle();
      idle.status.save('paused');
    }

    // When user interupts idle period -
    // pause idle and notify user that period isn't finished yet.
    // function pauseIdle () {
    //   var idlePeriod = idle.timeLeft || idle.period.load(),

    //     now = Date.now(),

    //     idleStartDate = idle.startDate.load();

    //   clearTimeout(idle.timerId);
    //   idle.timerId = null;

    //   // Define how much time left
    //   idle.timeLeft = idlePeriod - (now - idleStartDate);

    //   idle.status.save('paused');

    // }

    function trackAfk () {
      var t = idle.period.load();
      afk.startDate = Date.now();

      afk.timeoutId = setTimeout(function () {
        dontTrackAfk();
        endSession();

        console.log('session ended by AFK tracker');
      }, t);
    }

    function dontTrackAfk () {
      clearTimeout(afk.timeoutId);
      afk.timeoutId = null;
      afk.startDate = null;
    }


    router.on('state', function (message) {

       // Set this value to localStorage
       localStorage.setItem(message.name, message.value);

       // Then execute the main function
       switcher();
      }
    );

    this.switchOn = switchOn;
    this.switchOff = switchOff;

    switcher();
  };


  SK.modules = {};

  // Creates an object that has methods for retrieving and
  // setting value in localStorage to given key.
  SK.modules.Static = (function () {
    console.info('Static module');

    function createClass(target, props) {
      for (var key in props) {
        var prop = props[key];

        // @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties
        prop.configurable = true;
        prop.writable = true;
      }
      Object.defineProperties(target.prototype, props);
    }

    function Static (name, defaultValue) {

      // Key for localStorage
      this.name = name;

      // Default value for cases when there are some problems with
      // retrieving of value from localStorage
      // or just for reset purposes.
      this.defaultValue = defaultValue;

      // Initially load value from localStorage
      this.load();
    }

    createClass(Static, {

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
          //console.log("can't obtain the value ", this.name, 'reset to default value');

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
          handler(message);
        }
      };

      // @link https://developer.chrome.com/extensions/runtime#event-onMessage
      chrome.runtime.onMessage.addListener(this[name]);
    }

    this.send = send;
    this.on = on;
  };

  SK.modules.Badger = function () {
    console.info('badger module');

    // @link https://developer.chrome.com/extensions/browserAction#method-setIcon
    this.disableIcon = function () {
      chrome.browserAction.setIcon({
        path: '../img/popup-icon-off-19.png'
      }, function () {});
    };

    this.enableIcon = function () {
      chrome.browserAction.setIcon({
        path: '../img/popup-icon-on-19.png'
      }, function () {});
    };
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
  SK.modules.Notify = function () {
    console.info('Notify module');

    var sessionOpts = {
      type: 'basic',
      iconUrl: '../img/eyes_tired2.png',
      title: 'Take a break!',
      message: 'Working period was 45 mins, your eyes should rest 5 mins',
      contextMessage: 'Sight keeper ',
      priority: 2,
      buttons: [{
        title: 'SKIP',
        iconUrl: '../img/ignore_ico.jpg'
      }, {
        title: 'Remind in 5 minutes',
        iconUrl: '../img/remind_ico.jpg'
      }]
    },

    idleInterruptedOpts = {
      type: 'basic',
      iconUrl: '../img/eyes_tired2.png',
      title: 'Nope, you should rest',
      message: 'Don\'t touch the computer untill the idle end',
      contextMessage: 'Sight keeper',
      priority: 2,
      buttons: [{
        title: 'SKIP idle',
        iconUrl: '../img/ignore_ico.jpg'
      }]
    },

    idleEndedOpts = {
      body: 'Your eyes enough rest',
      icon: '../img/gj.png'
    },

    // Stores Notification instance
    notifIldeInded;


    function sessionEnded () {

      // @link https://developer.chrome.com/apps/notifications#method-create
      chrome.notifications.create('sessionEnd', sessionOpts, function (id) {

        setTimeout(function () {

          // @link https://developer.chrome.com/apps/notifications#method-clear
          chrome.notifications.clear(id, function () {});

        }, 23000);
      });
    }

    // Notifies that idle session is ended,
    // notification showed untill user make any imput.
    // @link https://developer.mozilla.org/en-US/docs/Web/API/notification
    function idleEnded () {
      notifIldeInded = new Notification('Good job!', idleEndedOpts);
    }

    function closeIdleEnded () {
      if (notifIldeInded) {
        notifIldeInded.close();
        notifIldeInded = null;
      }
    }

    function idleInterrupted () {

      // @link https://developer.chrome.com/apps/notifications#method-create
      chrome.notifications.create('idleInterrupted', idleInterruptedOpts, function (id) {

        setTimeout(function () {

          // @link https://developer.chrome.com/apps/notifications#method-clear
          chrome.notifications.clear(id, function () {});
        }, 7000);
      });
    }

    function closeAll () {
      chrome.notifications.clear('sessionEnd', function () {});
      chrome.notifications.clear('idleProgress', function () {});
      chrome.notifications.clear('idlePaused', function () {});
      closeIdleEnded();
    }


    this.sessionEnded = sessionEnded;
    this.idleEnded = idleEnded;
    this.closeIdleEnded = closeIdleEnded;
    this.idleInterrupted = idleInterrupted;
    this.closeAll = closeAll;
  };

  // Audio notifications
  SK.modules.Audio = function () {
    console.info('audio module');

    // dependency
    var Static = SK.modules.Static,
      audio = new Audio(''),
      volumeStatic = new Static('volume', '1');

    // Plays audio file with given index,
    // get's volume from localStorage (user preference)
    function play (index) {
      audio.src = 'audio/' + index + '.ogg';
      audio.volume = volumeStatic.load();
      audio.play();
    }

    function stop () {
      audio.src = '';
    }

    document.body.appendChild(audio);

    this.play = play;
    this.stop = stop;
  };


  window.sk = new SK();
})(window, window.document);
