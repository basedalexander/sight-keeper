/**
 * Creates a class for given target , and apply to its prototype props
 * @param  {constructor} target Constructor function
 * @param  {object} props  object wich contains properties with descriptors
 * @return {undefined}       returns nothing
 */
function _createClass(target, props) {
  'use strict';
  for (var key in props) {
    var prop = props[key];
    //@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties
    prop.configurable = true;
    prop.writable = true;
  }
  Object.defineProperties(target.prototype, props);
}

/** Assignment Static class to variable Static */
var Static = (function () {
  'use strict';
  console.info('Static module');

  function Static(name, defaultValue) {
    this.name = name;
    this.defaultValue = defaultValue;

    this.load();
  }

  _createClass(Static, {
    /**
     * Assign name's value do default and returns it value
     * @type {function}
     */
    reset: {
      value: function reset() {
        return this.save(this.defaultValue);
      }
    },
    /**
     * Loads value from localStorage and returns it,
     * If something wrong with loaded value - calls reset method;
     * @type {function}
     */
    load: {
      value: function load() {
        var value = localStorage.getItem(this.name);
        if (value !== null) {
          return value;
        } else {
          console.log("can't obtain the value ", this.name, 'reset to default value');
        }
        return this.reset();
      }
    },
    /**
     * Sets name's value in localStorage and returns it
     * @type {function}
     */
    save: {
      value: function save(value) {
        localStorage.setItem(this.name, value);
        return this.load();
      }
    }
  });
  /* Return class */
  return Static;
})();

/* Messenger class creates an instance , that has methods for sending and handling messages throughout the extention.
  Methods :
*/
var Messenger = (function () {
  'use strict';
  console.info('Messenger module');

  function Messenger(name) {
    /** @type {string} Identificator of instance */
    this.src = name;
  }

  _createClass(Messenger, {
    send: {
      value: function send(name, value, cb) {
        chrome.runtime.sendMessage({
            src: this.src,
            name: name,
            value: value
          },
          cb);
      }
    },
    on: {
      value: function on(name, handler) {
        var self = this;
        chrome.runtime.onMessage.addListener(function (message, sender, cb) {
          // Don't do anything since the message was sent from the same messenger
          if (message.src === self.src) return;
          if (message.name !== name) return;
          // Handle message
          handler(message);
        });
      }
    }
  });

  return Messenger;
})();


var msg = new Messenger('BACKEND');
msg.on('state', function (message) {
  var state = appState.save(message.value);
  if (state === 'on') {
    turnOn();
  } else {
    turnOff();
  }
});




















/*
Initialization
 */

var appState = new Static('state', 'on');

var session = {
  status: new Static('session.status', 'stopped'),
  period: new Static('session.period', '2700000'), //2700000 45min
  startDate: new Static('session.startDate', '0'),
};
var idle = {
  status: new Static('idle.status', 'stopped'),
  period: new Static('idle.period', '300000'), // 300000 5min
  startDate: new Static('idle.startDate', '0'),
};
// Initially reset all statuses and start dates
session.status.reset();
session.startDate.reset();
idle.status.reset();
idle.startDate.reset();

/* TODO do somthing with that crap */
var afkId;
var idleEndNotification;
var idleNotifOptions = {
  body: 'Well done, your eyes are fresh',
  icon: '../img/eyes_good.png'
};
/* ^^^^^^^^^^^^^^^^^^^^^^^^^^ */
console.info('initialization complete');

turnOn();
































function turnOn() {
  console.log('app turned ON');
  if (appState.load() === 'off') return;
  startSession();
  startListenToIdleState();
  chrome.browserAction.setIcon({
    path: '../img/popup-icon-on-19.png'
  }, function () {});
}

function turnOff() {
  console.log('app turned OFF');
  endSession();
  endIdle();
  stopListenToIdleState();
  appState.save('off');
  chrome.browserAction.setIcon({
    path: '../img/popup-icon-off-19.png'
  }, function () {});
}

function startListenToIdleState() {
  console.log('added idle listener');
  chrome.idle.setDetectionInterval(15);
  chrome.idle.onStateChanged.addListener(idleHandler);
}

function stopListenToIdleState() {
  console.log('idle listener removed');
  chrome.idle.onStateChanged.removeListener(idleHandler);
}

function idleHandler(idleState) {
  console.log(idleState + ' fired');
  if (idleState === 'idle') {
    if (session.status.load() === 'running') {
      trackAfk();
    }
    if (session.status.load() === 'stopped' && idle.status.load() === 'stopped') {
      startIdle();
    }
  }

  if (idleState === 'active') {
    if (session.status.load() === 'running') {
      dontTrackAfk();
    }
    if (idle.status.load() === 'running') {
      notifIdleProgress();
    }
    if (idle.status.load() === 'stopped' && session.status.load() === 'stopped') {
      if (idleEndNotification) idleEndNotification.close();
      startSession();
    }
  }
}

function buttonHandler(id, buttonIndex) {
  // When pressed 'SKIP' button - run session again
  if (buttonIndex === 0) {
    chrome.notifications.clear(id, function () {
      startSession();
      console.log('idle skipped');
    });
  } else {
    // When pressed 'remind in *' run session with time : '5 minutes'
    chrome.notifications.clear(id, function () {
      startSession(0.5 * 60000);
      console.log('session time set to 30 secs');
    });
  }
  // remove listener after pressing
  chrome.notifications.onButtonClicked.removeListener(buttonHandler);
}








































function startSession(time) {
  console.log('session started');
  var t = time || +session.period.load();
  session.status.save('running');
  session.startDate.save(Date.now());

  session.timerId = setTimeout(function () {
    endSession();
    notifEndSession();
  }, t);
}

function endSession() {
  console.log('session ended');
  clearTimeout(session.timerId);
  session.status.reset();
  session.startDate.reset();
  dontTrackAfk();
}

function startIdle(time) {
  console.log('idle started');
  var t = time || +idle.period.load();
  idle.status.save('running');
  idle.startDate.save(Date.now());

  idle.timerId = setTimeout(function () {
    endIdle();
    notifEndIdle();
  }, t);
}

function endIdle() {
  console.log('idle ended');
  clearTimeout(idle.timerId);
  idle.status.reset();
  idle.startDate.reset();
}

/* if user doesn't make any inputs in certain period of time
  then assume that he is afk */
function trackAfk() {
  console.log('tracking AFK...');
  afkId = setTimeout(function () {
    endSession();
  }, idle.period.load());
}

function dontTrackAfk() {
  console.log('stop tracking AFK');
  clearTimeout(afkId);
}











































function notifEndSession() {
  var id = 'session',
    options = {
      type: 'basic',
      iconUrl: '../img/eyes_tired2.png',
      title: 'Enough! ' + (session.period.load() / 60000) + ' minutes have passed',
      message: 'Take a ' + (idle.period.load() / 60000) + '-minute break',
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
  chrome.notifications.create(id, options, function (id) {
    // Adding listener to buttons in notification
    chrome.notifications.onButtonClicked.addListener(buttonHandler);

    setTimeout(function () {
      // remove button listeners
      chrome.notifications.onButtonClicked.removeListener(buttonHandler);
      // then clear notification
      chrome.notifications.clear(id, function () {});
    }, 15000);
  });
}

function notifEndIdle() {
  idleEndNotification = new Notification('BLA BLA', idleNotifOptions);
}

function notifIdleProgress() {
  var id = 'progress',
    options = {
      type: 'basic',
      iconUrl: '../img/eyes_tired.jpg',
      title: 'Idle time left :' + ms2min(idle.period.load() - (Date.now() - idle.startDate.load())),
      message: 'Get back to your exercises',
      contextMessage: 'Sight keeper',
      priority: 1,
    };
  chrome.notifications.create(id, options, function (id) {
    setTimeout(function () {
      chrome.notifications.clear(id, function () {});
    }, 3000);
  });
}

/** CONVERTER */
function ms2min (ms) {
  return Math.floor(ms / 60000);
}
