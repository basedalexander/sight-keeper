'use strict';

console.info('Static module');

var _createClass = (function () {
    function defineProperties(target, props) {
        var key, prop;
        for (key in props) {
            if (props.hasOwnProperty(key)) {
                prop = props[key];
                prop.configurable = true;
                if (prop.value) {
                    prop.writable = true;
                }
            }
        }
        Object.defineProperties(target, props);
    }
    return function (Constructor, protoProps, staticProps) {
        if (protoProps) {
            defineProperties(Constructor.prototype, protoProps);
        }
        if (staticProps) {
            defineProperties(Constructor, staticProps);
        }
        return Constructor;
    };
})();

var _classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
};

function Static (name, defaultValue) {

    _classCallCheck(this, Static);

    // Key for localStorage
    this.name = name;

    // Default value for cases when there are some problems with
    // retrieving of value from localStorage
    // or just for reset purposes.
    this.defaultValue = defaultValue;

    // Initialize value
    this.load();
}


_createClass(Static, {
    reset: {

        // Sets value to defaultValue and returns it
        value: function reset() {
            return this.save(this.defaultValue);
        }
    },
    load: {

        // Loads value from localStorage and returns it,
        // If there are problems - calls reset method.
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

    save: {
        // Sets value and returns it
        value: function save(value) {
            window.localStorage.setItem(this.name, value);

            return this.load();
        }
    }
});



module.exports = Static;
