
// Chrome API mock
window.chrome = {
    runtime: {
       onMessage: {
           addListener: function () {}
       },
        sendMessage: function () {}
    },

    browserAction: {
        setIcon: function () {}
    },

    idle: {
        onStateChanged: {
            addListener: function () {}
        },
        setDetectionInterval: function () {}
    },

    notifications : {

        create: function () {},

        clear: function () {},

        onButtonClicked : {
            addListener: function () {},

            removeListener: function () {}
        },

        onClicked: {
            addListener: function () {},

            removeListener: function () {}
        }
    }
};


// Audio constructor mock
window.Audio = function Audio (src) {
    var audio = document.createElement('audio');

    audio.src = src;

    audio.play = function (){};

    audio.pause = function () {};

    audio = document.body.appendChild(audio);

    return audio;
};


// Web Notifications mock
window.Notification = function () {};