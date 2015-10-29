var sessionTimer = document.getElementById('session-timer'),
    idleTimer = document.getElementById('idle-timer'),
    sessionIntervalId,
    idleIntervalId,
    diff,
    mins,
    secs;


function showSession () {
    router.send('getSessionStartDate', null , function (response) {
        if (!response) {
            return;
        }

        sessionTimer.innerHTML = printTime(response);

        sessionIntervalId = setInterval(function () {
            sessionTimer.innerHTML = printTime(response);
        }, 1000);
    });
}

function clearSession () {
    clearInterval(sessionIntervalId);
    sessionTimer.innerHTML = '00:00';
}

function restartSession () {
    clearSession();
    showSession();
}


function showIdle () {
    router.send('getIdleStartDate', null, function (response) {
        if (!response) {
            return;
        }

        idleTimer.innerHTML = printTime(response);

        idleIntervalId = setInterval(function () {
            idleTimer.innerHTML = printTime(response);
        }, 1000);
    });
}

function clearIdle () {
    clearInterval(idleIntervalId);
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

exports.showSession = showSession;
exports.clearSession = clearSession;
exports.showIdle = showIdle;
exports.clearIdle = clearIdle;
exports.restartSession = restartSession;
exports.restartIdle = restartIdle;