'use strict';

console.info('utils module');

/**
 * Module exports
 */

module.exports = {

  ms2min: function (ms) {
    return +(ms / 60000).toFixed(1);
  },

  min2ms: function (mins) {
    return mins * 60000;
  },

  sec2ms: function (sec) {
    return sec * 1000;
  },

  ms2sec: function (ms) {
    return ms / 1000;
  }
};
