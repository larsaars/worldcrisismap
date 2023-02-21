module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // define source files and their destinations
        // uglify: {
        //     build: {
        //         src: ['public/js/*.js', '!public/js/*.min.js'],  // source files mask
        //         dest: 'public/js/',    // destination folder
        //         expand: true,    // allow dynamic building
        //         flatten: true,   // remove all unnecessary nesting
        //         ext: '.min.js'   // replace .js to .min.js
        //     }
        // },
        cssmin: {
            target:{
                files: [{
                    expand: true,
                    cwd: 'public/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'public/css',
                    ext: '.min.css'
                }]
            }
        },
        watch: {
            js: {files: 'js/*.js', tasks: ['uglify']},
        }
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    // grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin')

    // register tasks
    // grunt.registerTask('default', ['cssmin', 'uglify']);
    grunt.registerTask('default', ['cssmin']);
};
