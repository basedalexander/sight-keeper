'use strict';

console.info('Period module');

/**
 * Module dependecies
 */

var Static = require('./Static');

/**
 * Module exports
 */

module.exports = Period;

function Period(name, time) {
  _classCallCheck(this, Period);
  this._status = new Static(name + '.status', 'stopped');
  this._period = new Static(name + '.period', time);
  this._startDate = new Static(name + '.startDate', '0');
  this._status.reset();
  this._startDate.reset();
  this.timeoutId = null;
}

extend(Period.prototype, {
  isRunning: function isRunning() {
    return this.getStatus() === 'running';
  },
  isPaused: function isPaused() {
    return this.getStatus() === 'paused';
  },
  setStatus: function setStatus(status) {
    return this._status.save(status);
  },
  getStatus: function getStatus() {
    return this._status.load();
  },
  resetStatus: function resetStatus() {
    return this._status.reset();
  },
  setPeriod: function setPeriod(period) {
    return this._period.save(period);
  },
  getPeriod: function getPeriod() {
    return this._period.load();
  },
  resetPeriod: function resetPeriod() {
    this._period.reset();
  },
  setStartDate: function setStartDate(date) {
    this._startDate.save(date);
  },
  getStartDate: function getStartDate() {
    this._startDate.load();
  },
  resetStartDate: function resetStartDate() {
    this._startDate.reset();
  }
});


/** Help functions */

function extend(receiver, supplier) {
  Object.keys(supplier).forEach(function (property) {
    var descriptor = Object.getOwnPropertyDescriptor(supplier, property);
    Object.defineProperty(receiver, property, descriptor);
  });
  return receiver;
}

function _classCallCheck (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}


