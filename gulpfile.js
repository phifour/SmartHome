/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var through = require('through2');
var browserSync = require('browser-sync');
var watchify = require('watchify');
var browserify = require('browserify');
// var uglifyify = require('uglifyify');
var uglifyify = require('gulp-uglifyjs');
var data = require('gulp-data')
var mergeStream = require('merge-stream');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var hbsfy = require("hbsfy");
var render = require('gulp-nunjucks-render');
var path = require('path');
var notify = require("gulp-notify");
var reload = browserSync.reload;
var config = require('./gulpconfig')
var fs = require('fs')
var stripDebug = require('gulp-strip-debug');
var swPrecache = require('sw-precache');

gulp.task('clean', function (done) {
    require('del')(['public'], done);
});

// gulp.task('browser-sync', function() {
//   browserSync({
//     notify: false,
//     port: 8000,
//     server: "dist",
//     open: false
//   });
// });

gulp.task('browser-sync', function () {
    browserSync({
        notify: false,
        port: 8000,
        open: false,
        server: {
            baseDir: "public",
            middleware: function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                next();
            }
        }
    });
});


// var exclude = path.normalize('!**/{' + config.tasks.html.excludeFolders.join(',') + '}/**')

var exclude = path.normalize('!**/{' + config.tasks.html.excludeFolders.join(',') + '}/**')

var paths = {
    src: [path.join(config.root.src, config.tasks.html.src, '/**/*.{' + config.tasks.html.extensions + '}'), exclude],
    dest: path.join(config.root.dest, config.tasks.html.dest),
}

var getData = function (file) {
    var dataPath = path.resolve(config.root.src, config.tasks.html.src, config.tasks.html.dataFile)
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

function handleErrors(errorObject, callback) {
    notify.onError(errorObject.toString().split(': ').join(':\n')).apply(this, arguments)
    // Keep gulp from hanging on this task
    if (typeof this.emit === 'function') this.emit('end')
}

var htmlTask = function () {

    return gulp.src(paths.src)
        .pipe(data(getData))
        .on('error', handleErrors)
        .pipe(render({
            path: [path.join(config.root.src, config.tasks.html.src)],
            envOptions: {
                watch: false
            }
        }))
        .on('error', handleErrors)
    // .pipe(gulpif(global.production, htmlmin(config.tasks.html.htmlmin)))
        .pipe(gulp.dest(paths.dest))
        .pipe(browserSync.stream())

}

gulp.task('html', htmlTask);

var dependenciesTask = function () {

    var settings = {
        src: path.join(config.root.src, config.tasks.dependencies.src, '/*.js'),
        dest: path.join(config.root.dest, config.tasks.dependencies.dest)
    }

    return gulp.src(settings.src)
        .pipe(gulp.dest(settings.dest))
        .pipe(browserSync.stream())
}

gulp.task('dependencies', dependenciesTask)

var CSSTask = function () {

    var settings = {
        src: path.join(config.root.src, config.tasks.css.src, '**/*.*'),
        dest: path.join(config.root.dest, config.tasks.css.dest)
    }

    return gulp.src(settings.src)
        .pipe(gulp.dest(settings.dest))
        .pipe(browserSync.stream())
}

gulp.task('css', CSSTask)

gulp.task('js', function () {
    gulp.src(['./src/js/**'])
        .pipe(concat('app.js'))
      //  .pipe(uglifyify())
      //  .pipe(stripDebug())
        .pipe(gulp.dest('./public/js/'))
});


function createBundler(src) {
    var b;

    if (plugins.util.env.production) {
        b = browserify();
    }
    else {
        b = browserify({
            cache: {}, packageCache: {}, fullPaths: true,
            debug: true
        });
    }

    b.transform(hbsfy);

    if (plugins.util.env.production) {
        b.transform({
            global: true
        }, 'uglifyify');
    }

    b.add(src);
    return b;
}

var bundlers = {
    'js/app.js': createBundler([
        './src/js/app.js',
        './src/js/ctrl/main.controller.js',
        './src/js/ctrl/geospatial.controller.js',
        './src/js/ctrl/keymetrics.controller.js',
        './src/js/ctrl/dataview.controller.js'                
    ]),
};

function bundle(bundler, outputPath) {
    var splitPath = outputPath.split('/');
    var outputFile = splitPath[splitPath.length - 1];
    var outputDir = splitPath.slice(0, -1).join('/');

    return bundler.bundle()
    // log errors if they happen
        .on('error', plugins.util.log.bind(plugins.util, 'Browserify Error'))
        .pipe(source(outputFile))
        .pipe(buffer())
        .pipe(plugins.sourcemaps.init({ loadMaps: true })) // loads map from browserify file
        .pipe(plugins.sourcemaps.write('./')) // writes .map file
        .pipe(plugins.size({ gzip: true, title: outputFile }))
        .pipe(gulp.dest('public/' + outputDir))
        .pipe(reload({ stream: true }));
}


gulp.task('data', function () {
    gulp.src(['./src/data/**'])
        .pipe(gulp.dest('./public/data/'))
});

gulp.task('img', function () {
    gulp.src(['./src/img/**'])
        .pipe(gulp.dest('./public/img/'))
});

gulp.task('fonts', function () {
    gulp.src(['./src/fonts/**'])
        .pipe(gulp.dest('./public/fonts/'))
});



gulp.task('watch', ['build'], function () {
    gulp.watch(['src/*.html'], ['html']);
    gulp.watch(['src/**/*.scss'], ['css']);

    Object.keys(bundlers).forEach(function (key) {
        var watchifyBundler = watchify(bundlers[key]);
        watchifyBundler.on('update', function () {
            return bundle(watchifyBundler, key);
        });
        bundle(watchifyBundler, key);
    });
});

gulp.task('generate-service-worker', function (callback) {
    var rootDir = 'public';
    swPrecache.write(path.join(rootDir, 'my-service-worker.js'), {
        staticFileGlobs: ['src/index.html','src/layouts/*.html', 'src/css/*.*', 'src/dependencies/*.js', 'src/js/app.js'],
        stripPrefix: 'src'
    }, callback);
});

//, 'src/data/*.*'

gulp.task('build', function () {
    // orig    return runSequence('clean', ['css', 'misc', 'html', 'js']);
    //   return runSequence(['css', 'misc', 'html', 'js']);
    return runSequence('clean', ['css', 'html', 'js', 'data', 'img', 'fonts', 'dependencies','generate-service-worker']);
});

gulp.task('serve', ['browser-sync', 'watch']);
gulp.task('default', ['build']);