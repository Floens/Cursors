var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var paths = {
    client: [
        'js/client/canvas.js',
        'js/client/canvas_manager.js',
        'js/client/client.js',
        'js/client/client_manager.js',
        'js/client/controls.js',
        'js/client/cursor.js',
        'js/client/msgpack.js',

        'js/client/client_init.js'
    ],
    server: [
        'js/server/server.js',
        'js/server/remote_client.js',

        'js/server/server_init.js'
    ],
    common: [
        'config.js',
        'js/common/common.js'
    ]
}

gulp.task('client', function() {
    gulp.src(['js/client/client_pre.js'].concat(paths.common, paths.client))
        .pipe(uglify())
        .pipe(concat('client.min.js'))
        .pipe(gulp.dest('build'));

    gulp.src('html/cursors.html')
        .pipe(gulp.dest('build'));

    gulp.src('css/cursors.css')
        .pipe(gulp.dest('build'));
});

gulp.task('server', function() {
    gulp.src(paths.common.concat(paths.server))
        .pipe(concat('server.min.js'))
        .pipe(gulp.dest('build'));
});

gulp.task('default', ['client', 'server']);
