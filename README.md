# Sight-keeper - is a chrome extension whose purpose is to save your sight.
Version :
```bash
v1.0.09
```

![alt text](https://raw.githubusercontent.com/thohoh/sight-keeper/master/src/img/snapshots/popup.jpg "Screenshot")

![alt text](http://i.imgur.com/jW2a3Kj.png?1 "Screenshot")


# Features :
- Reminds your when your eyes should take a break.
- Configurable periods.
- It is not neccesery to click something to start periods, except if you've decided to skip idle and start work period again.
- Break period considered satisfied only when user didn't any input manipulations.
- Smart afk detection.
- Works in background even when you closed the browser.

# Installation:
```bash
git clone https://github.com/thohoh/sight-keeper sight-keeper && cd sight-keeper
```
Then do following:
- In Chrome go to : Settings > More tools > Extentions.
- Ensure that "Developer mode" is checked (right top corner).
- Then click "load unpacked extention" and choose dist folder in sight-keeper
 folder.
- Enjoy.


# Want to contribute? Great!

To build :
```bash
npm run build
```
Test:
```bash
gulp test
```
Watcher:
```bash
gulp watch
```

 Check gulpfile.js for more tasks

