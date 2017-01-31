import cp from 'child_process';
import path from 'path';

import gulp from 'gulp';
import nodemon from 'gulp-nodemon';

import {CONFIG} from '../../config';

const browserSync = require('browser-sync');
const FLOGO_WEB_READY = 'flogo-web::server::ready';

let browserSyncInstance = null;

gulp.task('dev.start.db', () => {
  cp.spawn('npm', ['run', 'start-db'], {cwd: CONFIG.paths.dist.server, stdio: 'inherit'});
});

/**
 * Starts the server for development
 */
gulp.task('dev.start', 'Starts server app and db for development', ['dev.start.db'], () => {

  let npmTask = 'start-server';
  if (process.env['FLOGO_DEBUG']) {
    npmTask = 'start-debug';
  }

  nodemon({
    verbose: true,
    // DON'T use cwd here, it will change the whole gulp process cwd
    exec: `npm --prefix="${CONFIG.paths.dist.server}" run ${npmTask}`,
    watch: CONFIG.paths.serverWatch.map(watchPath => path.join(CONFIG.paths.dist.server, watchPath)),
    stdout: false
  })
    .on('stdout', function(stdout) {
      process.stdout.write(stdout);
      if(browserSyncInstance) {
        return;
      }

      const isServerReady = stdout.toString().includes(FLOGO_WEB_READY);
      if (isServerReady && browserSync.has('flogo-web')) {
        browserSyncInstance = browserSync.get('flogo-web');
        if (browserSyncInstance.active) {
          // already initialized, nothing to do here
          return;
        }
        browserSyncInstance.init({
          proxy:  {
            target: CONFIG.host
          }
        });

      }
    })
    .on('stderr', stderr => process.stderr.write(stderr));

  process.title = 'flogoweb';
  process.on('SIGINT', function () {
    setTimeout(function () {
      process.exit(1);
    }, 500);
  });

});
