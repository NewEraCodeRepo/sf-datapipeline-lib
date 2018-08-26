var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var tsProject = ts.createProject('tsconfig.json');
var examplesTSProject = ts.createProject('examples/tsconfig.json');

function buildTS(glob, destDir, callback, project=tsProject) {
    gulp.src(glob)
        .pipe(sourcemaps.init())
        .pipe(project())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(destDir))
        .on('end', callback);
}

gulp.task('ts-src', function (cb) {
	return buildTS('src/**/*.ts', 'build', cb);
});

gulp.task('build-examples', function(cb) {
   return buildTS('examples/**/*.ts', '.', cb, examplesTSProject);
});

gulp.task('ts', ['ts-src']);
