require('require-dir')('./gulp');
var runSequence = require("run-sequence");
var gulp = require("gulp");
var typedoc = require("gulp-typedoc");
const mocha = require('gulp-mocha');

gulp.task('default', function(callback) {
    runSequence('clean', 'ts', 'ts-lint', 'test', callback);
});

gulp.task('test', () =>
	gulp.src(['build/*.spec.js'], { read: false })
		.pipe(mocha({ reporter: 'spec', exit: true }))
		.on('error', console.error)
);

gulp.task('watch', function(callback) {
   gulp.watch('src/**/*.ts', ['default']);
});

gulp.task('dev', function (callback) {
    runSequence('default', 'watch');
});

gulp.task('docs', function(callback) {
    return gulp
        .src(['src/*.ts'])
        .pipe(typedoc({
            name: "DataPipeline Library",
            out: "./docs",
            readme: "./README.md",
            module: "commonjs",
            target: "es2017",
            includeDeclarations: true,
            exclude: "**/*.spec.ts",
            excludeExternals: true,
        }));
});
