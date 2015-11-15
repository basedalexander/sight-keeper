'use strict';

console.info('Notify module');


var sessionEndOpts = {
    type: 'basic',
    iconUrl: '../img/eye128.jpg',
    title: 'Take a break!',
    message: "Don't touch the computer until break time ended",
    contextMessage: 'Sight keeper ',
    priority: 2,
    buttons: [{
      title: 'SKIP',
      iconUrl: '../img/ignore_ico.jpg'
    }, {
      title: 'Remind in 5 minutes',
      iconUrl: '../img/remind_ico.jpg'
    }]
  },


  idleEndedOpts = {
    body: 'Now you can proceed',
    icon: '../img/eye48.png'
  },

// Stores Notification instance
  notifyIdleEnded;

/**
 * Module exprots
 */

exports.sessionEnded = sessionEnded;
exports.closeSessionEnded = closeSessionEnded;
exports.idleEnded = idleEnded;
exports.closeIdleEnded = closeIdleEnded;
exports.closeAll = closeAll;


function sessionEnded() {

  // @link https://developer.chrome.com/apps/notifications#method-create
  chrome.notifications.create('sessionEnd', sessionEndOpts, function (id) {
    setTimeout(function () {

      // @link https://developer.chrome.com/apps/notifications#method-clear
      chrome.notifications.clear(id, function () {
      });
    }, 23000);
  });
}

function closeSessionEnded () {
  chrome.notifications.clear('sessionEndOpts', function () {});
}

function idleEnded() {

  // @link https://developer.mozilla.org/en-US/docs/Web/API/notification
  notifyIdleEnded = new Notification('Good job!', idleEndedOpts);
}

function closeIdleEnded() {
  if (notifyIdleEnded) {
    notifyIdleEnded.close();
    notifyIdleEnded = null;
  }
}

function closeAll() {
  closeSessionEnded();
  closeIdleEnded();
}




