var timeoutId = null,
    startDate = null;

exports.start = function () {
    var t = idle.period.load();
    startDate = Date.now();

    //router.send('afk', startDate);

    timeoutId = setTimeout(function () {
        dontTrackAfk();
        endSession();
        router.send('sessionEnded');

        console.log('session ended by AFK tracker');
    }, t);
};

exports.stop = function () {
    //router.send('notAfk');
    clearTimeout(timeoutId);
    timeoutId = null;
    startDate = null;
};

exports.isAfk = function () {
    return !!timeoutId;
};