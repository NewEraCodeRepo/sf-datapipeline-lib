var gulp = require("gulp");
var mocha = require("gulp-mocha");

gulp.task("test", function() {
    gulp.src("./build/**/*.spec.js", {read: false})
    .pipe(mocha({
        reporter: "spec"
    }))
    .once('success', function(){
        console.log("Test is success");
        process.exit();
    })
    .once('error', function() {
        process.exit(1);
    })
    .once('end', function() {
        process.exit();
    });
});
