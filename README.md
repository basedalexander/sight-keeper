# Sight-keeper - is a chrome extension whose purpose is to save your sight.
Version :
```bash
v1.1.0
```

![alt text](http://i.imgur.com/LKZfdHU.jpg "Screenshot")

![alt text](http://i.imgur.com/jW2a3Kj.png?1 "Screenshot")


# Features :
- Reminds your when your eyes should take a break.
- There are two periods : WORK and BREAK, both configurable.
- The user could skip the break period or ask to remind him later.
- It is not neccesery to click somewhere to start periods, except you decided to skip break and start work period again.
- The extension uses **chrome's idle api** to detect whether user is active or not.
- Break period considered satisfied only when user was innactive full period. If you interrupt the break period - it resets and will be started again when you innactive. 
- Works **in background** even when you closed the browser.

# Installation:

Download [zip archive](https://github.com/thohoh/sight-keeper/archive/master.zip "zip archive") and extract **dist** folder somewhere.

or download the repository via terminal:

```bash
git clone https://github.com/thohoh/sight-keeper sight-keeper && cd sight-keeper
```

Then do following:
- In Chrome go to : Settings > More tools > Extentions.
- Ensure that "Developer mode" is checked (right top corner).
- Then click "load unpacked extention" and choose **dist** folder.
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

