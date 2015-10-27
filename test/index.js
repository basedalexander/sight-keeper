var expect = require('chai').expect,
    Period = require('../src/js/Period.js'),
    Static = require('../src/js/Static.js'),
    Notify = require('../src/js/notify.js');


describe('Static module', function() {
    var session = new Static('name', 'defaultValue');

    it('session', function() {
        expect(session.name).to.equal('name');
        expect(session.defaultValue).to.equal('defaultValue');
        expect(session.load()).to.equal('defaultValue');
        expect(session.save('1')).to.equal('1');
        expect(session.reset()).to.equal('defaultValue');
    });
});


describe('Period module', function () {
    var period = new Period('session', '60000');

    it('session', function () {
       expect(period.isRunning).not.to.equal(undefined);
    });
});
