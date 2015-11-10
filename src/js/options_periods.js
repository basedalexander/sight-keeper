var sessionTimer = document.getElementById('session-timer'),
  idleTimer = document.getElementById('idle-timer'),
  sessionIntervalId,
  idleIntervalId,
  diff,
  mins,
  secs,
  storage = window.localStorage;


function showSession() {
  var value = +storage.getItem('session.startDate');

  // Do nothing if session period isn't running
  if (!value) {
    return;
  }

  sessionTimer.innerHTML = printTime(value);
  sessionIntervalId = setInterval(function () {
    sessionTimer.innerHTML = printTime(value);
  }, 1000);
}

function clearSession() {
  clearInterval(sessionIntervalId);
  sessionTimer.innerHTML = '00:00';
}

function restartSession() {
  clearSession();
  showSession();
}

function showIdle(value) {

  var startDate = value || Date.now();
  idleTimer.innerHTML = printTime(startDate);

  idleIntervalId = setInterval(function () {
    idleTimer.innerHTML = printTime(startDate);
  }, 1000);
}

function clearIdle() {
  clearInterval(idleIntervalId);
  idleTimer.innerHTML = '00:00';
}

function printTime(time) {
  diff = new Date(Date.now() - time);

  mins = diff.getMinutes();
  if (mins < 10) {
    mins = '0' + mins;
  }
  secs = diff.getSeconds();
  if (secs < 10) {
    secs = '0' + secs;
  }

  return mins + ':' + secs;
}

exports.showSession = showSession;
exports.clearSession = clearSession;
exports.showIdle = showIdle;
exports.clearIdle = clearIdle;
exports.restartSession = restartSession;
