import path from  'path';
import fs from 'fs';
import child_process from 'child_process';
import del from 'del';

import gulp from 'gulp';
import inlineTemplate from 'gulp-inline-ng2-template';
import filter from 'gulp-filter';
import runSequence from 'run-sequence';
import rename from 'gulp-rename';

import less from 'less';

import {CONFIG} from '../../config';

const TMP_FOLDER = '.tmp';

/**
 * Generate app bundle file.
 * Makes a single javascript file from app and library sources.
 */
gulp.task('prod.client.bundle.app', false, [], cb => {

  runSequence(
    'prod.client.bundle.app.clean-tmp',
    'prod.client.bundle.app.inline-styles',
    'prod.client.bundle.app.copy-tsconfig',
    'prod.client.bundle.app.aot-compile',
    'prod.client.bundle.app.rollup',
    'prod.client.bundle.app.copy-bundle',
    cb);

});

gulp.task('prod.client.bundle.app.clean-tmp', 'Delete tmp folder', () => {
  return del.sync([`${TMP_FOLDER}/**/*`], {cwd: CONFIG.paths.source.client});
});

/**
 * Compile app's typescript files to javascript and inline html templates and styles
 */
gulp.task('prod.client.bundle.app.inline-styles',  false, () => {

  let componentFilter = filter('**/*.component.{js,ts}', {restore: true});

  return gulp.src(CONFIG.paths.ts, {cwd: CONFIG.paths.source.client})
    .pipe(componentFilter)
    .pipe(inlineTemplate({
      useRelativePaths: true,
      removeLineBreaks: true,
      customFilePath: convertExtensions,
      styleProcessor: processLess
    }))
    .pipe(componentFilter.restore)
    .pipe(gulp.dest(path.join(CONFIG.paths.source.client, TMP_FOLDER, 'compiled')));

});

gulp.task('prod.client.bundle.app.copy-tsconfig',  false, () => {
  return gulp.src(path.join(CONFIG.paths.source.client, 'tsconfig-aot.json'))
    .pipe(rename('tsconfig-aot.json'))
    .pipe(gulp.dest(path.join(CONFIG.paths.source.client, TMP_FOLDER, 'compiled')));

});

gulp.task('prod.client.bundle.app.aot-compile',  false, cb => {
  child_process.exec('../../node_modules/.bin/ngc -p tsconfig-aot.json',
    { cwd: path.join(CONFIG.paths.source.client, TMP_FOLDER, 'compiled') },
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    });
});

gulp.task('prod.client.bundle.app.rollup',  false, cb => {
  child_process.exec('node_modules/.bin/rollup -c rollup.js',
  { cwd: path.join(CONFIG.paths.source.client) },
  function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('prod.client.bundle.app.copy-bundle',  false, () => {
  return gulp.src(path.join(CONFIG.paths.source.client, TMP_FOLDER, 'dist/build.js'))
    .pipe(rename(CONFIG.bundles.app))
    .pipe(gulp.dest(path.join(CONFIG.paths.dist.public)));
});

function convertExtensions(ext, path) {
  if(ext == '.css') {
    let lessPath = path.replace(/\.css$/, '.less');
    try {
      // check less version exists
      fs.accessSync(lessPath, fs.F_OK);
      return lessPath;
    } catch (e) {
      // nothing to do, it didn't find the less version
    }
  }
  return path;

}

function processLess(path, ext, fileContent, cb) {

  less.render(fileContent, {
    paths: CONFIG.paths.lessImports,
    compress: true
  }, (err, output) => {
    onRender(err, output ? output.css : null);
  });

   function onRender(err, output) {
     return cb(err, output);
   }
}
