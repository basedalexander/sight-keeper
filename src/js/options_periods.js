var sessionTimer = document.getElementById('session-timer'),
  idleTimer = document.getElementById('idle-timer'),
  sessionIntervalId,
  idleIntervalId,
  storage = window.localStorage;

// Shows current session time
function showSession() {
  var value = +storage.getItem('session.startDate');

  // Session isn't running, do nothing.
  if (!value) {
    return;
  }

  sessionTimer.innerHTML = formatDate(value);
  sessionIntervalId = setInterval(function () {
    sessionTimer.innerHTML = formatDate(value);
  }, 1000);
}

// Resets session time to 00:00
function clearSession() {
  clearInterval(sessionIntervalId);
  sessionTimer.innerHTML = '00:00';
}

function restartSession() {
  clearSession();
  showSession();
}

// Shows current idle time
function showIdle(value) {
  var startDate = value || Date.now();
  idleTimer.innerHTML = formatDate(startDate);
  idleIntervalId = setInterval(function () {
    idleTimer.innerHTML = formatDate(startDate);
  }, 1000);
}

// Resets session time to 00:00
function clearIdle() {
  clearInterval(idleIntervalId);
  idleTimer.innerHTML = '00:00';
}

function formatDate(time) {
  var diff, mins, secs;

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
