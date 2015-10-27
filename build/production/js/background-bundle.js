(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

console.info('Engine module');

var Static = require('./Static.js'),
    Period = require('./Period.js'),
    Router = require('./Router.js'),
    badger = require('./badger.js'),
    utils  = require('./utils.js'),
    notify = require('./notify.js'),
    audio  = require('./audio.js');

var state = new Static('state', 'on'),
    session = new Period('session', '60000'),
    idle = new Period('idle', '30000'),
    router = new Router('backend'),

    afk = {
        timeoutId: null,
        startDate: null
    };

chrome.idle.setDetectionInterval(15);

function switcher() {

    // If app is on , then run it.
    if (state.load() === 'on') {
        switchOn();
    } else {

        // If it is 'off' then just change browserAction
        switchOff();
    }
}

function switchOn() {
    console.info('switched ON');

    addIdleListener();
    addBtnListener();
    startSession();
    router.send('sessionStarted');
    badger.enableIcon();

    console.log('session started , period : ' + session.period.load());
}

function switchOff() {
    console.log('SK is OFF');

    state.save('off');

    if (afk.timeoutId) {
        dontTrackAfk();
    }

    endSession();
    router.send('sessionEnded');
    endIdle();
    router.send('idleInded');
    rmIdleListener();
    rmBtnListener();
    badger.disableIcon();
    audio.stop();
    notify.closeAll();
}


function idleListener(idleState) {
    console.log(idleState + ' fired');

    var idleRunning = idle.isRunning(),
        sessionRunning = session.isRunning(),
        idlePaused = idle.isPaused();

    // If app state is 'off' - ignore
    if (state.load() === 'off') {
        return;
    }

    // IDLE state fired!
    if (idleState === 'idle') {

        // If session is running and user goes afk ,
        // start countdown certain amount of time, after witch
        // app assumes that user have rested.
        if (sessionRunning) {
            trackAfk();
            console.log('tracking AFK...');
        }

        // If session time elapsed and user doesn't do any inputs - start
        // idle period.
        if (!sessionRunning && !idleRunning) {
            startIdle();
            router.send('idleStarted');
            console.log('idle started , period : ' + idle.period.load());
        }

        if (idlePaused) {
            startIdle();
            router.send('idleStarted');
        }

        router.send('idle');
    }


    // ACTIVE state fired!
    if (idleState === 'active') {

        // If user was afk while session was running -
        // stop countdown afk time.
        if (sessionRunning) {
            dontTrackAfk();
            console.log('stop tracking AFK');
        }

        // If idle period is running and user have made an input -
        // notify user that idle period is not finished yet.
        if (idleRunning) {
            pauseIdle();
            notify.idleInterrupted();
            audio.play(1);
            router.send('idleEnded');
        }

        // If idle period finished and user makes an input -
        // start session period and close desktop notification
        // 'idle finished'.
        if (!idleRunning && !sessionRunning) {
            notify.closeIdleEnded();
            startSession();
            router.send('sessionStarted');
            console.log('session started since did input');
        }

        router.send('active');
    }
}

function addIdleListener() {
    chrome.idle.onStateChanged.addListener(idleListener);
    console.log('idle listener added');
}

function rmIdleListener() {
    chrome.idle.onStateChanged.removeListener(idleListener);
    console.log('idle listener removed');
}


function btnListener(id, buttonIndex) {

    // Chrome notification button's handler
    // @link https://developer.chrome.com/apps/notifications#event-onButtonClicked

    // Close notification when user clicks any button
    chrome.notifications.clear(id, function () {
    });

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

    router.send('sessionStarted');
}

function addBtnListener() {
    chrome.notifications.onButtonClicked.addListener(btnListener);
    console.log('btn listener added');
}

function rmBtnListener() {
    chrome.notifications.onButtonClicked.removeListener(btnListener);
    console.log('btn listener removed');
}


function startSession(time) {
    var t = time || +session.period.load();

    session.status.save('running');
    session.startDate.save(Date.now());

    session.timerId = setTimeout(function () {

        if (!isAfk()) {
            notify.sessionEnded();
            audio.play(1);
        } else {
            audio.play(1);
        }

        endSession();


        console.log('session ended');

    }, t);
}

function endSession() {

    // For cases when user was idling (was called trackAfk())
    clearTimeout(session.timerId);
    session.timerId = null;

    // Sets session status to default ('stopped')
    session.status.reset();

    // Sets session startDate to default ('0')
    session.startDate.reset();

    router.send('sessionEnded');


    // If session period finished while user is still afk - run idle
    // manually
    // @link https://developer.chrome.com/extensions/idle#method-queryState
    if (isAfk()) {
        dontTrackAfk();
        startIdle();
        router.send('idleStarted');
        console.log('idle started manually');
    }

}

function restartSession() {
    audio.stop();
    notify.closeAll();
    endSession();
    startSession();
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
        router.send('idleEnded');
    }, t);
}

function endIdle() {

    clearTimeout(idle.timerId);
    idle.timerId = null;

    idle.status.reset();
    idle.startDate.reset();

}

function pauseIdle() {
    endIdle();
    idle.status.save('paused');
}

function restartIdle() {
    audio.stop();
    notify.closeAll();
    endIdle();
    startIdle();
}


function trackAfk() {
    var t = idle.period.load();
    afk.startDate = Date.now();

    router.send('afk', afk.startDate);

    afk.timeoutId = setTimeout(function () {
        dontTrackAfk();
        endSession();
        router.send('sessionEnded');

        console.log('session ended by AFK tracker');
    }, t);
}

function dontTrackAfk() {
    router.send('notAfk');
    clearTimeout(afk.timeoutId);
    afk.timeoutId = null;
    afk.startDate = null;
}

function isAfk() {
    return !!afk.timeoutId;
}

function Engine () {

    // Pressed app switcher button
    router.on('state', function (message) {
            if (!message.value) {
                return state.load();
            }

            // Set this value to localStorage
            state.save(message.value);

            // Then execute the main function
            switcher();
        }
    );

    // Pressed the restart sesson button
    router.on('sessionRestart', function (message) {
            restartSession();
            return 1;
        }
    );

    // Applying new session period
    router.on('session.period', function (message) {
        session.setPeriod(message.value);

        endSession();
        router.send('sessionEnded');
        endIdle();
        router.send('idleInded');
        startSession();
        router.send('sessionStarted');
    });

    // Applying new idle period
    router.on('idle.period', function (message) {
        idle.setPeriod(message.value);
    });

    // Sounds turned off
    router.on('mute', function () {
        audio.setVolume(0);
    });

    // Sounds turned on
    router.on('unmute', function () {
        audio.setVolume(1);
    });

    //Checks 'state' value  when app has been loaded,
    // and does things depending on received value.


    this.switchOn = switchOn;
    this.switchOff = switchOff;

    switcher();
}

module.exports = Engine;
},{"./Period.js":2,"./Router.js":3,"./Static.js":4,"./audio.js":6,"./badger.js":7,"./notify.js":8,"./utils.js":9}],2:[function(require,module,exports){
'use strict';

var Static = require('./Static.js');

function Period (name, time) {
    this.status = new Static(name + '.status' , 'stopped');
    this.period = new Static(name + '.period', time);
    this.startDate = new Static(name + '.startDate', '0');
    this.status.reset();
    this.startDate.reset();
    this.timeoutId = null;

}

Period.prototype.isRunning = function () {
    return this.getStatus() === 'running';
};

Period.prototype.isPaused = function () {
    return this.getStatus() === 'paused';
};


Period.prototype.setStatus = function (status) {
    return this.status.save(status);
};

Period.prototype.getStatus = function () {
    return this.status.load();
};

Period.prototype.resetStatus = function () {
    return this.status.reset();
};



Period.prototype.setPeriod = function (period) {
    return this.period.save(period);
};

Period.prototype.getPeriod = function () {
    return this.period.load();
};

Period.prototype.resetPeriod = function () {
    return this.period.reset();
};



Period.prototype.setStartDate = function () {
    return this.startDate.save(Date.now());
};

Period.prototype.getStartDate = function () {
    return this.startDate.load();
};

Period.prototype.resetStartDate = function () {
    return this.startDate.reset();
};

module.exports = Period;

},{"./Static.js":4}],3:[function(require,module,exports){
'use strict';

console.info('Router module');

function Router (identifier) {

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
}


module.exports = Router;
},{}],4:[function(require,module,exports){
'use strict';

console.info('Static module');


function createClass(target, props) {
    var key,
        prop;

    for (key in props) {
        if ( props.hasOwnProperty(key)) {
            prop = props[key];

            // @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties
            prop.configurable = true;
            prop.writable = true;
        }

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



module.exports = Static;

},{}],5:[function(require,module,exports){
'use strict';

var Engine = require('./Engine.js');

var engine = new Engine();
},{"./Engine.js":1}],6:[function(require,module,exports){
'use strict';

console.info('audio module');

var Static = require('./Static.js');


var audio = new Audio(''),
    volumeStatic = new Static('volume', '1');

document.body.appendChild(audio);


function play (index) {
    audio.src = 'audio/' + index + '.ogg';
    audio.volume = volumeStatic.load();
    audio.play();
}

function stop () {
    audio.src = '';
}

function setVolume (volume) {
    volumeStatic.save(volume);
}


exports.play = play;
exports.stop = stop;
exports.setVolume = setVolume;

},{"./Static.js":4}],7:[function(require,module,exports){
'use strict';

console.info('badger module');


// @link https://developer.chrome.com/extensions/browserAction#method-setIcon
exports.disableIcon = function () {
    chrome.browserAction.setIcon({
        path: '../img/eye-icon-off-19.png' // '../img/popup-icon-off-19.png'
    }, function () {});
};

exports.enableIcon = function () {
    chrome.browserAction.setIcon({
        path: '../img/eye-icon-on-19.png' // '../img/popup-icon-on-19.png'
    }, function () {});
};


},{}],8:[function(require,module,exports){
'use strict';

console.info('Notify module');



var sessionOpts = {
        type: 'basic',
        iconUrl: '../img/eye128.jpg', // '../img/eyes_tired2.png'
        title: 'Take a break!',
        message: 'Do not touch the computer whole the rest period',
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
        iconUrl: '../img/eye128.jpg',
        title: 'Take a break!',
        message: 'Do not touch the computer whole the rest period',
        contextMessage: 'Sight keeper',
        priority: 2,
        buttons: [{
            title: 'SKIP idle',
            iconUrl: '../img/ignore_ico.jpg'
        }]
    },

    idleEndedOpts = {
        body: 'Now you can proceed',
        icon: '../img/eye48.png' // '../img/gj.png'
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



exports.sessionEnded = sessionEnded;
exports.idleEnded = idleEnded;
exports.closeIdleEnded = closeIdleEnded;
exports.idleInterrupted = idleInterrupted;
exports.closeAll = closeAll;


},{}],9:[function(require,module,exports){
'use strict';

console.info('converter module');


exports.ms2min = function (ms) {
    return +(ms / 60000).toFixed(1);
};

exports.min2ms = function (mins) {
    return mins * 60000;
};

exports.sec2ms = function (sec) {
    return sec * 1000;
};

exports.ms2sec = function (ms) {
    return ms / 1000;
};


},{}]},{},[5])


//# sourceMappingURL=background-bundle.js.map
