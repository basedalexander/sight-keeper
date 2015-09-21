chrome.runtime.sendMessage('message', function (response) {
  alert(response);
});


chrome.runtime.onMessage.addListener(function (message, sender, cb) {
  console.log(message.name, sender);
  cb('hello');
});
