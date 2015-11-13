module.exports = function () {
  var audio =  document.createElement('audio');
  audio.play = function () {};
  audio.stop = function () {};
  return audio;
};