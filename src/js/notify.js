'use strict';

console.info('Notify module');



var sessionOpts = {
        type: 'basic',
        iconUrl: '../img/eye128.jpg',
        title: 'Take a break!',
        message: 'Do not touch the computer whole the rest period',
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

    idleInterruptedOpts = {
        type: 'basic',
        iconUrl: '../img/eye128.jpg',
        title: 'Take a break!',
        message: 'Do not touch the computer whole the rest period',
        contextMessage: 'Sight keeper',
        priority: 2,
        buttons: [{
            title: 'SKIP idle',
            iconUrl: '../img/ignore_ico.jpg'
        }]
    },

    idleEndedOpts = {
        body: 'Now you can proceed',
        icon: '../img/eye48.png'
    },

    // Stores Notification instance
    notifIldeInded;


function sessionEnded () {

    // @link https://developer.chrome.com/apps/notifications#method-create
    chrome.notifications.create('sessionEnd', sessionOpts, function (id) {

        setTimeout(function () {

            // @link https://developer.chrome.com/apps/notifications#method-clear
            chrome.notifications.clear(id, function () {});

        }, 23000);
    });
}

// Notifies that idle session is ended,
// notification showed untill user make any imput.
// @link https://developer.mozilla.org/en-US/docs/Web/API/notification
function idleEnded () {
    notifIldeInded = new Notification('Good job!', idleEndedOpts);
}

function closeIdleEnded () {
    if (notifIldeInded) {
        notifIldeInded.close();
        notifIldeInded = null;
    }
}


function idleInterrupted () {

    // @link https://developer.chrome.com/apps/notifications#method-create
    chrome.notifications.create('idleInterrupted', idleInterruptedOpts, function (id) {

        setTimeout(function () {

            // @link https://developer.chrome.com/apps/notifications#method-clear
            chrome.notifications.clear(id, function () {});
        }, 7000);
    });
}

function closeAll () {
    chrome.notifications.clear('sessionEnd', function () {});
    chrome.notifications.clear('idleProgress', function () {});
    chrome.notifications.clear('idlePaused', function () {});
    closeIdleEnded();
}



exports.sessionEnded = sessionEnded;
exports.idleEnded = idleEnded;
exports.closeIdleEnded = closeIdleEnded;
exports.idleInterrupted = idleInterrupted;
exports.closeAll = closeAll;

