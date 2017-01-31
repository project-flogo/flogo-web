import gulp from 'gulp';
import changed from 'gulp-changed';
import {CONFIG} from '../config';

/**
 * Copies server files to dist folder
 */
gulp.task('server.copy', 'Copies server app files to dist folder', () => {
  return gulp.src(["**/*", '!**/*.js', "package.json", "!**/node_modules/**"], {cwd: CONFIG.paths.source.server})
    .pipe(changed(CONFIG.paths.dist.server))
    .pipe(gulp.dest(CONFIG.paths.dist.server));
});


