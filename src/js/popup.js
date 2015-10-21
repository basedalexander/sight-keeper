var switcher = document.querySelector('#app');

var message = {
  id: 'FRONTEND',
  name: 'state',
  value: 'off'
};

var btn = document.body.querySelector('.button-wrap');
btn.addEventListener('click', function() {
  if (this.classList.contains('button-active')) {
    message.value = 'off';
  } else {
    message.value = 'on';
  }

  this.classList.toggle("button-active");

  chrome.runtime.sendMessage(message, function () {});
});

document.body.addEventListener('dblclick', function (e) {
  e.preventDefault();
});

(function init() {
  var state = localStorage.getItem('state');
  if (state === 'on') {
    btn.classList.add('button-active');
   } else {
    btn.classList.remove('button-active');
  }
})();




// function send(messageObj, responseCallback) {
//   chrome.runtime.sendMessage(messageObj, responseCallback);
// }

// switcher.addEventListener('change', function (e) {
//   if (e.target.checked) {
//     message.value = 'on';
//   } else {
//     message.value = 'off';
//   }

//   chrome.runtime.sendMessage(message, function () {});

// });




