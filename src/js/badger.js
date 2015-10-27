'use strict';

console.info('badger module');


// @link https://developer.chrome.com/extensions/browserAction#method-setIcon
exports.disableIcon = function () {
    chrome.browserAction.setIcon({
        path: '../img/eye-icon-off-19.png' // '../img/popup-icon-off-19.png'
    }, function () {});
};

exports.enableIcon = function () {
    chrome.browserAction.setIcon({
        path: '../img/eye-icon-on-19.png' // '../img/popup-icon-on-19.png'
    }, function () {});
};

