"use strict";


/**
 * Module is responsible for displaying current period's time,
 * afk indicator and reminder indicator.
 */

/**
 * Module dependencies
 */

var utils = require('./utils');

/**
 * Module exports
 */

exports.showSession = showSession;
exports.clearSession = clearSession;
exports.showIdle = showIdle;
exports.clearIdle = clearIdle;
exports.restartSession = restartSession;
exports.updateSession = updateSession;
exports.updateIdle = updateIdle;


var sessionTimer      = document.getElementById('session-timer'),
  idleTimer           = document.getElementById('idle-timer'),
  remind              = document.getElementById('remind'),
  storage             = window.localStorage,
  sessionIntervalId,
  idleIntervalId;

(function init() {
  sessionTimer.innerHTML    = formatDate(storage.getItem('session.period'));
  idleTimer.innerHTML       = formatDate(storage.getItem('idle.period'));
})();

// Shows current session time
function showSession(reminderTime) {
  var startDate = +storage.getItem('session.startDate'),
    period,
    goal;

  // Session isn't running, do nothing.
  if (!startDate) {
    return;
  }

  period = reminderTime || +storage.getItem('session.period');

  if (reminderTime) {
    remind.classList.add('shown');
  }

  // Time when period will be ended.
  goal = startDate + period;

  sessionTimer.innerHTML = showTimeLeft(goal);
  sessionIntervalId = setInterval(function () {
    sessionTimer.innerHTML = showTimeLeft(goal);
  }, 1000);
}

// Resets session time
function clearSession() {
  clearInterval(sessionIntervalId);
  sessionIntervalId = null;
  sessionTimer.innerHTML = formatDate(storage.getItem('session.period'));
  remind.classList.remove('shown');
}

function restartSession() {
  clearSession();
  showSession();
}

// Shows current idle time
function showIdle(value) {
  var startDate     = value || Date.now(),
      period        = +storage.getItem('idle.period'),
      goal          = period + startDate;

  idleTimer.innerHTML = showTimeLeft(goal);
  idleIntervalId = setInterval(function () {
    idleTimer.innerHTML = showTimeLeft(goal);
  }, 1000);
}

function clearIdle() {
  clearInterval(idleIntervalId);
  idleIntervalId = null;
  idleTimer.innerHTML = formatDate(storage.getItem('idle.period'));
}

function showTimeLeft (goal) {
  return formatDate(goal - Date.now());
}

function formatDate(date) {
  var hours, mins, secs;

  date = new Date(+date);

  hours = date.getHours() - 3;
  if (hours === 0) {
    hours = '';
  } else {
    hours += ':';
  }

  mins = date.getMinutes();
  if (mins < 10) {
    mins = '0' + mins;
  }

  secs = date.getSeconds();
  if (secs < 10) {
    secs = '0' + secs;
  }
  return hours + mins + ':' + secs;
}

function updateSession () {

  // If timer isn't running
  if (!sessionIntervalId) {
    sessionTimer.innerHTML = formatDate(storage.getItem('session.period') - new Date(0));
  }
}

function updateIdle () {

  // If timer isn't running
  if (!idleIntervalId) {
    idleTimer.innerHTML = formatDate(storage.getItem('idle.period') - new Date(0));
  }
}

