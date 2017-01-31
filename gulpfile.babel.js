/**
 * Flogo web build process
 *
 * Run `gulp help` in terminal for a list an description of tasks
 *
 * Tasks are automatically loaded from '/gulp/tasks' folder.
 * Configuration located in '/gulp/config'
 */

import gulp from 'gulp';
import help from 'gulp-help';

import runSequence from 'run-sequence';

import requireDir from 'require-dir';

// patch gulp for help features
help(gulp, {hideDepsMessage: true});

// Automatically load tasks
requireDir('./gulp/tasks', {
  recurse: true
});

/**
 * Default is prod mode
 */
gulp.task('default', ['prod']);

/**
 * Build an start production mode
 */
gulp.task('prod', 'Build and start in production mode', cb => runSequence(
  'build',
  'prod.start',
  cb
));

/**
 * Build but don't run
 */
gulp.task('build', 'Build in production mode (does not start the server or db, use `prod` instead)', cb => runSequence(
  'clean',
  'prod.build',
  cb
));

/**
 * Build and start development mode
 */
gulp.task('dev', 'Build and start in development mode', cb => {

  runSequence(
    'clean',
    'dev.build',
    'dev.watch',
    'dev.start',
    cb
  );

});

/**
 * Build development mode, start db and watch for changes.
 *
 * Start your server manually by running `node --debug server.js` in dist/server
 *
 */
gulp.task('local-debug', 'Build development mode, start db and watch for changes', cb => {

  runSequence(
    'clean',
    'dev.build',
    'dev.watch',
    'dev.start.db',
    cb
  );

});

gulp.task('release', '', cb => {
  runSequence(
    'prod.build',
    'palette.build',
    'dist.support-files',
    'dist.build-engines',
    cb);

});

gulp.task('docs', 'Documentation for Flogo-web', cb => {
  runSequence(
    'docs.generate-swagger',
    cb);
});



