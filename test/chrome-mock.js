module.exports = {
  runtime: {
      sendMessage: function () {},
      onMessage: {
        addListener: function () {},
        removeListener: function () {}
      }
  },

  // Notifications
  notifications: {
    create: function () {},
    clear: function () {},
    onButtonClicked: {
      addListener: function () {},
      removeListener: function () {}
    }
  },

  // Browser action
  browserAction: {
    setIcon: function () {}
  },

  // Idle
  idle: {
    onStateChanged: {
      addListener: function () {},
      removeListener: function () {}
    },
    setDetectionInterval: function () {}
  }
};
