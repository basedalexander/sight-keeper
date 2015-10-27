'use strict';

console.info('Static module');


function createClass(target, props) {
    var key,
        prop;

    for (key in props) {
        if ( props.hasOwnProperty(key)) {
            prop = props[key];

            // @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties
            prop.configurable = true;
            prop.writable = true;
        }

    }
    Object.defineProperties(target.prototype, props);
}

function Static (name, defaultValue) {

    // Key for localStorage
    this.name = name;

    // Default value for cases when there are some problems with
    // retrieving of value from localStorage
    // or just for reset purposes.
    this.defaultValue = defaultValue;

    // Initially load value from localStorage
    this.load();
}


createClass(Static, {

    // Sets value to defaultValue and returns it
    reset: {
        value: function reset() {
            return this.save(this.defaultValue);
        }
    },

    // Loads value from localStorage and returns it,
    // If there are problems - calls reset method.
    load: {
        value: function load() {
            var value = window.localStorage.getItem(this.name);

            // If value successfuly retrieved - return it
            if (value !== null) {
                return value;
            }

            // Otherwise reset it to defaultValue
            //console.log("can't obtain the value ", this.name, 'reset to default value');

            return this.reset();
        }
    },

    // Sets value and returns it
    save: {
        value: function save(value) {
            window.localStorage.setItem(this.name, value);

            return this.load();
        }
    }
});



module.exports = Static;
