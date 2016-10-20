import path from 'path';

const source = 'src';
const dist = process.env.DIST_BUILD ? 'dist/build' : 'dist';

const sourcePaths = {
  root: source,
  client: path.join(source, 'client'),
  server: path.join(source, 'server'),
  packages: path.join(source, 'packages')
};

export const CONFIG = {
  paths: {
    source: sourcePaths,
    dist: {
      root: dist,
      public: path.join(dist, 'public'),
      server: path.join(dist, 'server'),
      packages: path.join(dist, 'packages')
    },
    ts: ['../../typings/index.d.ts', '**/*.ts', '**/*.spec.ts', '!**/*.e2e.ts', '!node_modules/**/*.ts'],
    less: ['{assets,app,common}/**/*.less', '!{assets,app,common}/**/_*.less'],
    assets: ['**/*', '!**/*.ts', '!**/*.js', '!**/*.less', '!**/*.js.map', '!**/node_modules/**'],
    serverSrc: ['**/*', 'package.json', '!**/node_modules/**'],
    distAssets: ['**/*', '!{app,common}/**/*.html', '!**/*.ts', '!**/*.js', '!**/*.less', '!**/*.js.map', '!**/node_modules/**'],
    distLess: ['assets/**/*.less', '!{app,common}/**/*.less'],
    lessImports: ['.', path.join(sourcePaths.client, 'assets')],
    // directories that should be watched by running server so it restarts if something changes
    serverWatch: ['api', 'common', 'config', 'modules', 'server.js']
  },
  host: 'localhost:3010',
  libs: {
    js: [
      'node_modules/core-js/client/shim.min.js',
      'node_modules/reflect-metadata/Reflect.js',

      'node_modules/systemjs/dist/system-polyfills.src.js',
      'node_modules/systemjs/dist/system.src.js',

      // needs to be loaded after core-js
      'node_modules/zone.js/dist/zone.js',

      'node_modules/jquery/dist/jquery.js',
      'node_modules/d3/d3.js',
      'node_modules/lodash/lodash.js',
      'node_modules/postal/lib/postal.js',
      'node_modules/pouchdb/dist/pouchdb.js',
      'node_modules/bootstrap/dist/js/bootstrap.js',
      'node_modules/moment/min/moment-with-locales.min.js',

      'node_modules/ng2-bs3-modal/bundles/ng2-bs3-modal.min.js',
      //'node_modules/ng2-translate/bundles/ng2-translate.js',

      'dev.env.js',
      'systemjs.config.js',

      'node_modules/_tmp/Rx.js'
    ],
    styles: [
      'node_modules/bootstrap/dist/css/**/*',
      'node_modules/bootstrap/dist/fonts/**/*'
    ],
    dist: {
      vendors: [
        'node_modules/es6-shim/es6-shim.min.js',
        'node_modules/es6-promise/dist/es6-promise.min.js',
        'node_modules/reflect-metadata/Reflect.js',

        // Not required as we're building self-executing bundles
        // 'node_modules/systemjs/dist/system-polyfills.src.js',

        // needs to be loaded after es6-shim and es6-promise
        'node_modules/zone.js/dist/zone.min.js',

        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/d3/d3.min.js',
        'node_modules/lodash/lodash.min.js',
        'node_modules/postal/lib/postal.min.js',
        'node_modules/pouchdb/dist/pouchdb.js',
        'node_modules/bootstrap/dist/js/bootstrap.min.js',
        'node_modules/moment/min/moment-with-locales.min.js'
      ],
      js: [
        'js/lib.bundle.js',
        'app.bundle.js'
      ]
    }
  },
  bundles: {
    lib: 'lib.bundle.js',
    app: 'app.bundle.js'
  }


};
