module.exports = function (grunt) {
  // grunt.registerTask('default', 'Log stuff', function () {
  //   grunt.log.write('write something');
  // });

  grunt.initConfig({
     watch: {
       scripts: {
         files: ['**/*.js'],
         tasks: ['lint'],
         options: {
           spawn: false
         }
       }
     },
    jasmine: {
      src: 'src/**/*ound.js',
      options: {
        vendor: 'spec/helpers.js',
        specs: 'spec/*.js',
        summary: false,
        keepRunner: true
      }
    },
    jshint: {
      all: [
        'src/**/*.js'
       // 'spec/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
        force: true
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
