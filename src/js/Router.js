'use strict';

console.info('Router module');

function Router (identifier) {

    // Unique identifier for current script
    var id = identifier,
        listeners = {};

    function send (name, value, cb) {

        // @link https://developer.chrome.com/extensions/runtime#method-sendMessage
        chrome.runtime.sendMessage({
                id: id,
                name: name,
                value: value
            },
            cb);
    }

    function on (name, handler) {

        // Save handler in router object.
        listeners[name] = function (message, sender, cb) {

            // If message was send from another Router instance or
            // message name is not what we expecting then do nothing.
            if (message.id !== id && message.name === name) {

                // Handle message
                cb(handler(message));
            }
        };

        // @link https://developer.chrome.com/extensions/runtime#event-onMessage
        chrome.runtime.onMessage.addListener(listeners[name]);
    }

    this.send = send;
    this.on = on;
}


module.exports = Router;