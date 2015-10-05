module.exports = function (grunt) {
  // grunt.registerTask('default', 'Log stuff', function () {
  //   grunt.log.write('write something');
  // });

  grunt.initConfig({
     watch: {
       scripts: {
         files: ['**/*.js'],
         tasks: ['default'],
         options: {
           spawn: false
         }
       }
     },
    jasmine: {
      src: 'src/**/*ound.js',
      options: {
        specs: 'spec/*.js',
        summary: false,
        keepRunner: true
      }
    },
    jshint: {
      all: [
        'src/**/*ound.js',
        'spec/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('default', ['test']);
};
