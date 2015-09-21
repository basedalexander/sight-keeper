var SESSION_TIME = 45 * 60000,
  IDLE_TIME = (5 * 60000) - 15000, // -15sec because of minimum detection time
  session = {
    status: 'done',
    id: null,
    notification: {
      text: "Eyes should rest",
      closeIn: 10000,
      interval: 1 * 60000
    }
  },
  idle = {
    status: 'done',
    id: null,
    notification: {
      text: "You could work",
      closeIn: 3000,
      interval: 1 * 60000
    }
  };

chrome.idle.setDetectionInterval(15);

chrome.idle.onStateChanged.addListener(function (idleStatus) {
  console.log(idleStatus + ' fired');
  if (idleStatus === 'idle') {
    // If the session is running and user away from computer,
    // then the edle starts early. It idle will be canceled if user
    // come before idle time elapsed.
    if (session.status === 'running' && idle.status === 'done') {
      beginEarlyIdle();
    }
    // If session have successfully finished and user decided to get rest
    if (session.status === 'done' && idle.status === 'done') {
      beginIdle();
    }
  }

  if (idleStatus === 'active') {
    // If user came back before the early idle  completed,
    // then procceed the session as if nothing happened;
    if (session.status === 'running' && idle.status === 'running early') {
      cancelEarlyIdle();
    }
    // If user got rest and came back to work
    if (session.status === 'done' && idle.status === 'done') {
      beginSession();
    }
    // If user interrupt idle, then idle will canceled
    if (idle.status === 'running' && session.status === 'done') {
      cancelIdle();
      console.log('HEY, YOU EYES HAVE TO REST');
      showWarningNotification();
    }
  }
});


// Initialy start session
beginSession();


function beginSession() {
  console.log('session started at ' + logTime());
  session.status = 'running';
  session.id = setTimeout(endSession, SESSION_TIME);
}

function endSession() {
  console.log('session ended at ' + logTime());
  session.status = 'done';
  session.id = null;
  console.log('SESSION ENDED , GET REST');
  showWarningNotification();
  // If session time was elapsed and user still idling since early idle was started
  if (idle.status === 'running early') {
    cancelEarlyIdle();
    // Start idle manualy because 'idle' state won't be fired in this case
    beginIdle();
  }


}


function beginIdle() {
  console.log('idle started at ' + logTime());
  idle.status = 'running';
  idle.id = setTimeout(endIdle, IDLE_TIME);
}

function endIdle() {
  console.log('idle ended at ' + logTime());
  idle.status = 'done';
  idle.id = null;
  console.log('IDLE ENED, COULD WORK');
}


function beginEarlyIdle() {
  console.log('early idle started at ' + logTime());
  idle.status = 'running early';
  idle.id = setTimeout(endEarlyIdle, IDLE_TIME);
}

function endEarlyIdle() {
  console.log('early idle ended at ' + logTime());
  // Stop session and assume it was finished
  clearTimeout(session.id);
  session.status = 'done';
  idle.status = 'done';
  idle.id = null;
}

function cancelIdle() {
  console.log('idle canceled at ' + logTime());
  clearTimeout(idle.id);
  idle.id = null;
  idle.status = 'done';
}

function cancelEarlyIdle() {
  console.log('early idle canceled at ' + logTime());
  clearTimeout(idle.id);
  idle.id = null;
  idle.status = 'done';
}



// Helper functions
function logTime() {
  var d = new Date(Date.now());
  return d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}


//The notification shown after session was ended
function showWarningNotification() {
  chrome.notifications.create('sessionEnded', {
    type: 'basic',
    iconUrl: '../img/logo-128.png',
    title: session.notification.text,
    message: 'Sight keeper'
  }, function (notificationId) {
    setTimeout(function () {
      chrome.notifications.clear(notificationId, function () {});
    }, session.notification.closeIn);
  });
}

// The notification shown after idle was ended
function showIdleEnded() {
  chrome.notifications.create('idleEnded', {
    type: 'basic',
    iconUrl: '../img/logo-128.png',
    title: idle.notification.text,
    message: 'Sight keeper'
  }, function (notificationId) {
    setTimeout(function () {
      chrome.notifications.clear(notificationId, function () {});
    }, session.notification.closeIn);
  });
}
