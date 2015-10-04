module.exports = function (grunt) {
  // grunt.registerTask('default', 'Log stuff', function () {
  //   grunt.log.write('write something');
  // });

  grunt.initConfig({
    // watch: {
    //   scripts: {
    //     files: ['**/*.js'],
    //     tasks: ['myTask'],
    //     options: {
    //       spawn: false
    //     }
    //   }
    // },
    jasmine: {
      src: 'src/**/*ound.js',
      options: {
        specs: 'spec/*.js',
        summary: false
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('default', ['test']);
};
