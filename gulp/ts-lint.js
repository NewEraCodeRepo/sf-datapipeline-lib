var gulp = require('gulp');
var tslint = require("tslint");
var gulpTslint = require("gulp-tslint");
var ts = require("gulp-typescript");
var plumber = require('gulp-plumber');

var tsProject = ts.createProject("tsconfig.json");

// To enable rules that work with the type checker
var program = tslint.Linter.createProgram("./tsconfig.json", ".");

gulp.task("ts-lint", function() {
    return tsProject.src()
        .pipe(plumber({
            errorHandler: function (error) {
                console.log("[ts-lint]: " + error.message);
                process.exit(1);
            }
        }))
        .pipe(gulpTslint({
            formatter: "stylish",
            program: program
        }))
        .pipe(gulpTslint.report({
            emitError: true,
            summarizeFailureOutput: true,
            allowWarnings: true
        }))
        .pipe(plumber.stop())
        .pipe(tsProject());
});
