'use strict';

console.info('converter module');


exports.ms2min = function (ms) {
    return +(ms / 60000).toFixed(1);
};

exports.min2ms = function (mins) {
    return mins * 60000;
};

exports.sec2ms = function (sec) {
    return sec * 1000;
};

exports.ms2sec = function (ms) {
    return ms / 1000;
};

