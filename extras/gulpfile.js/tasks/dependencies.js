var config      = require('../config')
if(!config.tasks.dependencies) return

var browserSync = require('browser-sync')
var gulp        = require('gulp')

var path        = require('path')

var dependenciesTask = function() {

  var settings = {
    src: path.join(config.root.src, config.tasks.dependencies.src, '/*.*'),
    dest: path.join(config.root.dest, config.tasks.dependencies.dest)
  }

  return gulp.src(settings.src)
    .pipe(gulp.dest(settings.dest))
    .pipe(browserSync.stream())
}

gulp.task('dependencies', dependenciesTask)
module.exports = dependenciesTask
