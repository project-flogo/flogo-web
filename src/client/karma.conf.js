'use strict';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    // files needed by angular js plus application and test files
    files: [
      //Polyfills
      'node_modules/es6-shim/es6-shim.js',
      'node_modules/reflect-metadata/Reflect.js',
      // System.js
      'node_modules/systemjs/dist/system-polyfills.js',
      'node_modules/systemjs/dist/system.src.js',
      // lodash
      'node_modules/lodash/lodash.js',
      // jquery
      'https://code.jquery.com/jquery-1.11.2.min.js',
      // moment
      'node_modules/moment/moment.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',
      // rxjs dependencies
      {pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false /*, served: true*/},
      {pattern: 'node_modules/rxjs/**/*.js.map', included: false, watched: false /*, served: true*/},
      // angular dependencies
      {pattern: 'node_modules/@angular/**/*.js', included: false, watched: false},
      {pattern: 'node_modules/@angular/**/*.js.map', included: false, watched: false},
      // ng2-bs3-modal
      { pattern: 'node_modules/ng2-bs3-modal/components/*.js', included: false, watched: false },
      { pattern: 'node_modules/ng2-bs3-modal/directives/*.js', included: false, watched: false },
      { pattern: 'node_modules/ng2-bs3-modal/ng2-bs3-modal.js', included: false, watched: false   },
      // ng2-translate
      { pattern: 'node_modules/ng2-translate/ng2-translate.js', included: false, watched: false },
      { pattern: 'node_modules/ng2-translate/src/*.js', included: false, watched: false },
      // our application
      {pattern: 'main.js', included: false, watched: true},
      {pattern: '*(app|common)/**/**.js', included: false, watched: true},
      {pattern: '*(app|common)/**/**.js.map', included: false, watched: true},
      // paths loaded via Angular's component compiler
      // (these paths need to be rewritten, see proxies section)
      {pattern: 'app/**/*.*(html|css)', included: false, watched: true},
      {pattern: 'assets/**/*.*(png|svg)', included: false, watched: true},
      // helper
      {pattern:'karma.helper.js', included: true, watched: true}
    ],
    // exclude angular 2 test files
    exclude: [
      'node_modules/@angular/**/*_spec.js',
      'common/services/rest-api-test.spec.js'
    ],
    // proxied base paths
    proxies: {
      // required for component assests fetched by Angular's compiler
      "/app/": "/base/app/",
      "/common/": "/base/common/",
      "/assets/": "/base/assets/"
    },
    reporters: ['spec'],
    port: 9876,
    colors: true,
    autoWatch: false,
    // use Chrome to launch the tests
    browsers: [
      'Chrome'
    ],
    logLevel: config.LOG_INFO,
    singleRun: true
  });
};