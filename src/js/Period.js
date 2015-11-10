'use strict';

var _createClass = (function () {
  function defineProperties(target, props) {
    var key, prop;
    for (key in props) {
      if (props.hasOwnProperty(key)) {
        prop = props[key];
        prop.configurable = true;
        if (prop.value) {
          prop.writable = true;
        }
      }
    }
    Object.defineProperties(target, props);
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) {
      defineProperties(Constructor.prototype, protoProps);
    }
    if (staticProps) {
      defineProperties(Constructor, staticProps);
    }
    return Constructor;
  };
})();

var _classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};


var Static = require('./Static');

console.info('Period module');

function Period(name, time) {

  _classCallCheck(this, Period);

  this._status = new Static(name + '.status', 'stopped');
  this._period = new Static(name + '.period', time);
  this._startDate = new Static(name + '.startDate', '0');
  this.timeoutId = null;
  this._status.reset();
  this._startDate.reset();
}


_createClass(Period, {
  isRunning: {
    value: function isRunning() {
      return this.getStatus() === 'running';
    }
  },
  isPaused: {
    value: function isPaused() {
      return this.getStatus() === 'paused';
    }
  },
  setStatus: {
    value: function setStatus(status) {
      return this._status.save(status);
    }
  },
  getStatus: {
    value: function getStatus() {
      return this._status.load();
    }
  },
  resetStatus: {
    value: function resetStatus() {
      return this._status.reset();
    }
  },
  setPeriod: {
    value: function setPeriod(period) {
      return this._period.save(period);
    }
  },
  getPeriod: {
    value: function getPeriod() {
      return this._period.load();
    }
  },
  resetPeriod: {
    value: function resetPeriod() {
      this._period.reset();
    }
  },
  setStartDate: {
    value: function setStartDate(date) {
      this._startDate.save(date);
    }
  },
  getStartDate: {
    value: function getStartDate() {
      this._startDate.load();
    }
  },
  resetStartDate: {
    value: function resetStartDate() {
      this._startDate.reset();
    }
  }
});


module.exports = Period;
