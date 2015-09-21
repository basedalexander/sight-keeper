describe('Testing background.js functionality', function () {
  describe('Create audio element', function () {
    it('Check whether elem was created', function () {
      createAudioElem();
      expect(timer.audio.nodeName).toEqual('AUDIO');
    });
    it('Check if audio elem has loop attr', function () {
      expect(timer.audio.getAttribute('loop')).toEqual('true');
    });
    it('Check if audio elem has autoplay attr', function () {
      expect(timer.audio.getAttribute('autoplay')).toEqual('true');
    });
    it('Check if audio elem has volume attr', function () {
      expect(typeof timer.audio.volume).toEqual('number');
    });
  });

  describe('FormatDate function ', function () {
    it('Passing date argument - miliseconds', function () {
      expect(formatDate(422625)).toEqual("7:02");
    });
    it('Passing date argument - miliseconds', function () {
      expect(formatDate(952655)).toEqual("15:52");
    });
  });

});
