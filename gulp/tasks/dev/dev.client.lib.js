import path from 'path';

import gulp from 'gulp';
import del from 'del';
import vinyl from 'vinyl-fs';

import {CONFIG} from '../../config';

let Builder = require('systemjs-builder');

const DEPENDENCIES_DIRNAME = 'node_modules';

/**
 * Link third party libs to build folder
 */
gulp.task('dev.client.lib', 'Link third party libs to build folder',
  ['dev.client.lib.rxjs'],
  () => {
    del.sync([path.join(CONFIG.paths.dist.public, DEPENDENCIES_DIRNAME)]);
    return vinyl.src(path.join(CONFIG.paths.source.client, DEPENDENCIES_DIRNAME), {followSymlinks: false})
      .pipe(vinyl.symlink(CONFIG.paths.dist.public));
  });

// avoid multiple requests in development mode for rxjs
gulp.task('dev.client.lib.rxjs', () => {

  let options = {
    normalize: true,
    runtime: false,
    sourceMaps: true,
    sourceMapContents: true,
    minify: false,
    mangle: false
  };

  let clientPath = path.join(CONFIG.paths.source.client);

  let builder = new Builder(clientPath);
  builder.config({
    paths: {
      "n:*": "node_modules/*",
      "rxjs/*": "node_modules/rxjs/*.js",
    },
    map: {
      "rxjs": "n:rxjs",
    },
    packages: {
      "rxjs": {main: "Rx.js", defaultExtension: "js"},
    }
  });

  builder.bundle('rxjs', path.join(clientPath, 'node_modules', '_tmp', 'Rx.js'), options);

});
