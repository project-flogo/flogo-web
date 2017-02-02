module.exports = function(config) {

  var appBase      = 'app/'; // component assets fetched by Angular's compiler
  var appCommon    = 'common/';      // transpiled app JS and map files
  var appAssets    = 'assets/';      // transpiled app JS and map files

  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-spec-reporter'),
    ],


    client: {
      builtPaths: [appBase, appCommon, appAssets ], // add more spec base paths as needed
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },

    customLaunchers: {
      // From the CLI. Not used here but interesting
      // chrome setup for travis CI using chromium
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    files: [
      // System.js for module loading
      'node_modules/systemjs/dist/system.src.js',

      // Polyfills
      'node_modules/core-js/client/shim.js',

      // todo: necessary?
      'node_modules/reflect-metadata/Reflect.js',

      // lodash
      'node_modules/lodash/lodash.js',

      // zone.js
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/zone.js/dist/proxy.js',
      'node_modules/zone.js/dist/sync-test.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',

      // jquery
      'node_modules/jquery/dist/jquery.js',

      'node_modules/d3/d3.js',
      'node_modules/lodash/lodash.js',
      'node_modules/postal/lib/postal.js',
      'node_modules/bootstrap/dist/js/bootstrap.js',
      'node_modules/moment/min/moment-with-locales.min.js',
      'node_modules/socket.io-client/socket.io.js',

      'node_modules/ng2-bs3-modal/bundles/ng2-bs3-modal.min.js',

      // RxJs
      { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
      { pattern: 'node_modules/rxjs/**/*.js.map', included: false, watched: false },

      // Paths loaded via module imports:
      // Angular itself
      { pattern: 'node_modules/@angular/**/*.js', included: false, watched: false },
      { pattern: 'node_modules/@angular/**/*.js.map', included: false, watched: false },

      // ng2-bs3-modal
      {pattern: 'node_modules/ng2-bs3-modal/components/*.js', included: false, watched: false},
      {pattern: 'node_modules/ng2-bs3-modal/directives/*.js', included: false, watched: false},
      {pattern: 'node_modules/ng2-bs3-modal/ng2-bs3-modal.js', included: false, watched: false},

      // ng2-translate
      {pattern: 'node_modules/ng2-translate/bundles/ng2-translate.umd.js', included: false, watched: false},

      { pattern: 'systemjs.config.test.js', included: false, watched: false },
      'karma-test-shim.js', // optionally extend SystemJS mapping e.g., with barrels

      // transpiled application & spec code paths loaded via module imports
      { pattern: appCommon + '**/*.js', included: false, watched: true },
      // TODO: verify
      { pattern: 'main.js', included: false, watched: true },
      { pattern: '*(app|common)/**/**.js', included: false, watched: true },
      { pattern: '*(app|common)/**/**.js.map', included: false, watched: true },

      // Asset (HTML & CSS) paths loaded via Angular's component compiler
      // (these paths need to be rewritten, see proxies section)
      { pattern: appBase + '**/*.*(html|css)', included: false, watched: true },
      { pattern: appAssets + '**/*.*(png|svg)', included: false, watched: true }
      // Paths for debugging with source maps in dev tools
      //
      //{ pattern: appSrcBase + '**/*.ts', included: false, watched: false },
      //{ pattern: appCommon + '**/*.js.map', included: false, watched: false },
      //{ pattern: testingSrcBase + '**/*.ts', included: false, watched: false },
      //{ pattern: testingBase + '**/*.js.map', included: false, watched: false}
    ],

    // Proxied base paths for loading assets
    proxies: {
      // required for component assets fetched by Angular's compiler
      "/app/": "/base/"+appBase,
      "/common/": "/base/common/",
      "/assets/": "/base/assets/"
    },

    exclude: [
      'node_modules/@angular/**/*_spec.js',
      'common/services/rest-api-test.spec.js'
    ],
    preprocessors: {},
    reporters: ['kjhtml', 'spec'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  })
};
