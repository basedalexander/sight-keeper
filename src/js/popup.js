var switcher = document.querySelector('#app');

(function init() {
  var state = localStorage.getItem('state');
  if (state === 'on') {
    switcher.checked = true;
  } else {
    switcher.checked = false;
  }
})();


function send(messageObj, responseCallback) {
  chrome.runtime.sendMessage(messageObj, responseCallback);
}

var message = {
  id: 'FRONTEND',
  name: 'state',
  value: 'off'
};

switcher.addEventListener('change', function (e) {
  if (e.target.checked) {
    message.value = 'on';
  } else {
    message.value = 'off';
  }
  chrome.runtime.sendMessage(message, function () {});

});
