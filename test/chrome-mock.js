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
    clear: function () {}
  },

  // Browser action
  browserAction: {
    setIcon: function () {}
  }
};
