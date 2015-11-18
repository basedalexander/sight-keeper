'use strict';

/**
 * Module responsible for sending and receiving messages
 * between extension's scripts.
 */

console.info('Router module');

/**
 * Module exports
 */

module.exports = Router;


function Router(identifier) {

  if (!(this instanceof Router)) {
    return new Router(identifier);
  }

  var self = this;
  this._id = identifier;
  this._listeners = {};

  this.send = function (name, value, cb) {

    // @link https://developer.chrome.com/extensions/runtime#method-sendMessage
    chrome.runtime.sendMessage({
        id: this._id,
        name: name,
        value: value
      },
      cb);
  };

  this.on = function (name, handler) {

    // Save handler in router object.
    this._listeners[name] = function (message, sender, cb) {

      // If message was send from another Router instance or
      // message name is not what we expecting then do nothing.
      if (message.id !== self._id && message.name === name) {

        // Handle message
        cb(handler(message));
      }

    };

    // @link https://developer.chrome.com/extensions/runtime#event-onMessage
    chrome.runtime.onMessage.addListener(this._listeners[name]);
    return this;
  };

  this.deregister = function (name) {
    if (name in this._listeners) {
      chrome.runtime.onMessage.removeListener(this._listeners[name]);
      delete this._listeners[name];
    }
  };

}
