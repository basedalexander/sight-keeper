'use strict';

// Gulp Dependencies
var gulp = require('gulp');
var rename = require('gulp-rename');

// Build Dependencies
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

// Development Dependencies
var jshint = require('gulp-jshint');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');

// Test Dependencies
var mochaPhantomjs = require('gulp-mocha-phantomjs');

// Release Dependecies
var strip = require('gulp-strip-debug');
var uglify = require('gulp-uglify');


// Setup
/******************************************************************************/

var bg = {
    src : ['src/js/bg.js'],
    devName: 'background-bundle.js',
    devOpts: {
        entries: ['src/js/bg.js'],
        debug: true
    },
    devDest: 'build/dev/js/',
    prodName: 'background.js',
    prodDest: 'dist/js/'

};

var test = {
    src : ['test/index.js'],
    devName: 'test-bundle.js',
    devOpts: {
        entries: ['test/index.js'],
        debug: true
    },
    devDest: 'build/dev/js/',
    html: 'test/index.html'
};


var browserifyOnError = function (err) {
    gutil.log(gutil.colors.red('browserify task ' + err.name + ': ' + err.message));
    this.emit('end');
};



// Tasks
/****************************************************************************/
// Lint
gulp.task('lint-src', function () {
     return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('lint-test', function () {
     return gulp.src('test/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});


// Browserify
gulp.task('browserify-src', ['lint-src'], function () {
     return browserify(bg.devOpts)
    .bundle()
    .on('error', browserifyOnError)
    .pipe(source(bg.devName))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(bg.devDest));
});

gulp.task('browserify-test', ['lint-test'], function () {
     return browserify(test.devOpts)
    .bundle()
    .on('error', browserifyOnError)
    .pipe(source(test.devName))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(test.devDest));
});



// Test
gulp.task('test', ['lint-test', 'browserify-test'], function () {
     return gulp.src(test.html)
    .pipe(mochaPhantomjs())
    .on('error', function (){})
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['lint-src', 'browserify-src', 'browserify-test','test']);
    gulp.watch('test/*.js', ['lint-test','lint-src', 'browserify-test', 'test']);
});


gulp.task('default', ['browserify-src', 'browserify-test', 'test']);

// Release
gulp.task('release', function () {
   return gulp.src(bg.devDest + bg.devName)
   .pipe(strip())
   .pipe(uglify())
   .on('error', gutil.log)
   .pipe(rename(bg.prodName))
   .pipe(gulp.dest(bg.prodDest));
});


