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
