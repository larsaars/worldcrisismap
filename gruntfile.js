module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // define source files and their destinations
        uglify: {
            build: {
                src: ['public/js/*.js', '!public/js/*.min.js'],  // source files mask
                dest: 'public/js/',    // destination folder
                expand: true,    // allow dynamic building
                flatten: true,   // remove all unnecessary nesting
                ext: '.min.js'   // replace .js to .min.js
            }
        },
        watch: {
            js: {files: 'js/*.js', tasks: ['uglify']},
        }
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // register at least this one task
    grunt.registerTask('default', ['uglify']);


};