describe('Static', function () {
  var instance = new Static('Gena', 'human');
  it('Ckeck whether all properties and methods exist', function () {
    expect(instance.name).toEqual('Gena');
    expect(instance.defaultValue).toEqual('human');
    expect(typeof instance.reset).toBe('function');
    expect(typeof instance.load).toBe('function');
    expect(typeof instance.save).toBe('function');
  });
  it('Check if sync methods are working properly', function () {
    expect(instance.load()).toBe('human');
    expect(instance.save('zerg')).toBe('zerg');
    expect(instance.reset()).toBe('human');
  });
});

describe('Messenger', function () {
  var msg = new Messenger('BACKEND');
  it('Check whether all properties and methods exist', function () {
    expect(msg.src).toBe('BACKEND');
    expect(typeof msg.send).toBe('function');
    expect(typeof msg.on).toBe('function');
  });
  /*
  chrome.runtime.sendMessage('message', function (response) {
    alert(response);
  });
  chrome.runtime.onMessage.addListener(function (message, sender, cb) {
    console.log(message.name, sender);
    cb('hello');
  });
   */
});
