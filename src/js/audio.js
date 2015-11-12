'use strict';

console.info('audio module');


/**
 * Module dependencies
 */

var Static = require('./Static.js');


/**
 * Module exports
 */

exports.play = play;
exports.stop = stop;
exports.setVolume = setVolume;



var audio = new Audio(''),
  volumeStatic = new Static('volume', '1');

document.body.appendChild(audio);


function play(index) {
  audio.src = 'audio/' + index + '.ogg';
  audio.volume = volumeStatic.load();
  audio.play();
}

function stop() {
  audio.src = '';
}

function setVolume(volume) {
  return volumeStatic.save(volume);
}

