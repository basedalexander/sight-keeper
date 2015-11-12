'use strict';

console.info('Static module');

/**
 * Modules exprots
 */

module.exports = Static;

/**
 * Creates and object,
 * that deals with localStorage
 * @param name {string} key
 * @param defaultValue {string/number} value
 * @constructor
 */

function Static(name, defaultValue) {
  _classCallCheck(this, Static);

  // Key for localStorage
  this._name = name;

  // Default value to reset
  this._defaultValue = defaultValue;

  // Initialize value
  this.load();
}


extend(Static.prototype, {

  /**
   * Resets value to _defaultValue and returns it
   * @returns {string}
   */

  reset: function () {
    return this.save(this._defaultValue);
  },

  /**
   * Loads value from storage,
   * if there is no value in storage - saves and return _defaultValue
   * @returns {string}
   */

  load: function () {
    var value = window.localStorage.getItem(this._name);

    // If value successfuly retrieved - return it
    if (!!value) {
      return value;
    }

    // Otherwise reset it to defaultValue
    //console.log("can't obtain the value ", this.name, 'reset to default value');
    return this.reset();
  },

  /**
   * Sets the given value and returns it
   * @param value {string}
   * @returns {string}
   */
  save: function (value) {
    window.localStorage.setItem(this._name, value);
    return this.load();
  }
});


/** Help functions */

function extend(receiver, supplier) {
  Object.keys(supplier).forEach(function (property) {
    var descriptor = Object.getOwnPropertyDescriptor(supplier, property);
    Object.defineProperty(receiver, property, descriptor);
  });
  return receiver;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
