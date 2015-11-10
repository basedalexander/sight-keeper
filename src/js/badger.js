'use strict';

console.info('badger module');


exports.enableIcon = enableIcon;
exports.disableIcon = disableIcon;


// @link https://developer.chrome.com/extensions/browserAction#method-setIcon
function disableIcon() {
  chrome.browserAction.setIcon({
    path: '../img/eye-icon-off-19.png'
  }, function () {
  });
}

function enableIcon() {
  chrome.browserAction.setIcon({
    path: '../img/eye-icon-on-19.png'
  }, function () {
  });
}

