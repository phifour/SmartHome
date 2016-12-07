var compress = require('compression')
var config   = require('../config')
var express  = require('express')
var router = express.Router();              // get an instance of the express Router
var gulp     = require('gulp')
var gutil    = require('gulp-util')
var logger   = require('morgan')
var open     = require('open')
var path     = require('path')
var mongoose = require('mongoose');

var settings = {
  root: path.resolve(process.cwd(), config.root.dest),
  port: process.env.PORT || 5000,
  logLevel: process.env.NODE_ENV ? 'combined' : 'dev',
  staticOptions: {
    extensions: ['html'],
    maxAge: '31556926'
  }
}

var serverTask = function() {
    
  var url = 'http://localhost:' + settings.port

  var app = express();
  
    console.log("is this serve ractually running ???");
  
    app.use(compress())
    app.use(logger(settings.logLevel))
    app.use('/', express.static(settings.root, settings.staticOptions))
    app.listen(settings.port)
    
  gutil.log('production server started on ' + gutil.colors.green(url))
  open(url)
}

gulp.task('server', serverTask)
module.exports = serverTask
