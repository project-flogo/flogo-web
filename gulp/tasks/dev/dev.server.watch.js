import gulp from 'gulp';
import {CONFIG} from '../../config';

/**
 * Watch server sources and execute the dev tasks when they change
 */
gulp.task('dev.server.watch', 'Watch server sources and execute the dev tasks when they change', () => {
  gulp.watch(CONFIG.paths.serverSrc, {cwd: CONFIG.paths.source.server}, ['server.copy', 'server.dev.transpile']);
});
