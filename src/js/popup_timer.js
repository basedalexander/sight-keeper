"use strict";

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


var sessionTimer = document.getElementById('session-timer'),
  idleTimer = document.getElementById('idle-timer'),
  sessionIntervalId,
  idleIntervalId,
  storage = window.localStorage;

(function init() {
  sessionTimer.innerHTML = formatDate(storage.getItem('session.period'));
  idleTimer.innerHTML = formatDate(storage.getItem('idle.period'));
})();

// Shows current session time
function showSession(sessionPeriod) {
  var startDate = +storage.getItem('session.startDate'),
      period = sessionPeriod || +storage.getItem('session.period'),
      goal;

  // Session isn't running, do nothing.
  if (!startDate) {
    return;
  }

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
}

function restartSession() {
  clearSession();
  showSession();
}

// Shows current idle time
function showIdle(value) {
  var startDate = value || Date.now(),
      period = +storage.getItem('idle.period'),
      goal = period + startDate;

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
  var mins, secs;

  date = new Date(+date);

  mins = date.getMinutes();
  if (mins < 10) {
    mins = '0' + mins;
  }

  secs = date.getSeconds();
  if (secs < 10) {
    secs = '0' + secs;
  }
  return mins + ':' + secs;
}

function updateSession () {

  // If timer isn't running
  if (!sessionIntervalId) {
    sessionTimer.innerHTML = formatDate(storage.getItem('session.period'));
  }
}

function updateIdle () {

  // If timer isn't running
  if (!idleIntervalId) {
    idleTimer.innerHTML = formatDate(storage.getItem('idle.period'));
  }
}

