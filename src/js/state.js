'use strict';

console.info('status module');

/**
 * Module dependecies
 */

var Static = require('./Static.js');

/**
 * Module exports
 */

exports.get = get;
exports.setOn = setOn;
exports.setOff = setOff;
exports.isOn = isOn;


var state = new Static('state', 'on');

function get() {
  return state.load();
}

function setOn() {
  state.save('on');
}

function setOff() {
  state.save('off');
}

function isOn() {
  return get() === 'on';
}

