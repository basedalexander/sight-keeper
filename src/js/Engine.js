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

    session.setStatus('running');
    session.setStartDate(Date.now());

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