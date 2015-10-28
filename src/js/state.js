var Static = require('./Static.js');

var state = new Static('state', 'on');

function get () {
    return state.load();
}

function setOn () {
    state.save('on');
}

function setOff () {
    state.save('off');
}

function isOn () {
    return get() === 'on';
}

exports.get = get;
exports.setOn = setOn;
exports.setOff = setOff;
exports.isOn = isOn;