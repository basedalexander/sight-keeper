// var _createClass = (function () {
//   function defineProperties(target, props) {
//     var key, prop;
//     for (key in props) {
//       prop = props[key];
//       prop.configurable = true;
//       if (prop.value) {
//         prop.writable = true;
//       }
//       Object.defineProperties(target, props);
//     }
//   }

//   return function (Constructor, props, staticProps) {
//     if (props) {
//       defineProperties(Constructor.prototype, props);
//     }
//     if (staticProps) {
//       defineProperties(Constructor, props);
//     }
//     return Constructor;
//   };

// })();

// function _checkClassInstance(instance, Constructor) {
//   if (!(instance instanceof Constructor)) {
//     throw new Error('Cannot call the class as a function');
//   }
// }


// var Messenger = (function () {
//   function Messenger(name) {
//     this.name = name;
//   }
// //@link https://developer.chrome.com/extensions/messaging
//   _createClass(Messenger, {
//     send: {
//       value: function send(name, value, cb) {
//         //@link https://developer.chrome.com/extensions/runtime#method-sendMessage
//         // chrome.runtime.sendMessage([string extensionId,] any message, [object options, ][function responseCallback])
//         chrome.runtime.sendMessage({
//           src: this.name,
//           name: name,
//           value: value
//         }, cb);
//       }
//     },
//     on: function on(name, handler) {
//       //@link https://developer.chrome.com/extensions/runtime#event-onMessage
//       // chrome.runtime.onMessage.addListener(function callback)
//       // function([any message,] MessageSender sender, function sendResponse) {...};
//       var self = this;
//       this.listener = function (message, sender, sendResponse) {
//         if (message.name === name && message.src !== self.name) {
//           alert(this.name + ' has taken message: ' + message.name + ' ' + message.value);
//           nandler({
//             hello: 'helooooooooo'
//           });
//         }
//       };
//       chrome.runtime.onMessage.addListener(this.listener);

//     },
//     unregister: function unregister() {

//     }
//   });

//   return Messenger;
// })();

chrome.runtime.onMessage.addListener(function (message, sender, cb) {
  console.log(message.name, sender);
  cb('hello');
});
