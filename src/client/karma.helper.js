// Turn on full stack traces in errors to help debugging
Error.stackTraceLimit = Infinity;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

/**
 * Cancel Karma's synchronous start, we will call `__karma__.start()` later, once all the specs are loaded.
 */
__karma__.loaded = function () {
};

function isJsFile(path) {
  return path.slice(-3) == '.js';
}

function isSpecFile(path) {
  return path.slice(-8) == '.spec.js';
}

function isBuiltFile(path) {
  var builtPath = '/base/app';
  var commonPath = '/base/common';

  return  isJsFile(path) && (
          (path.substr(0, builtPath.length) == builtPath) ||
          (path.substr(0, commonPath.length) == commonPath)
         );
}

var allSpecFiles = Object.keys(window.__karma__.files)
  .filter(isSpecFile)
  .filter(isBuiltFile);


System.config({
  baseURL: '/base/'
});

System.config({

  map: {
    'rxjs': 'node_modules/rxjs',
    '@angular': 'node_modules/@angular',
    'app': 'app',
    'common': 'common',
    'ng2-bs3-modal': 'node_modules/ng2-bs3-modal',
    'ng2-translate': 'node_modules/ng2-translate'
  },
  packages: {
    'ng2-translate': {
      defaultExtension: 'js'
    },
    'ng2-bs3-modal': {
      defaultExtension: 'js'
    },
    'app': {
      defaultExtension: 'js'
    },
    'common': {
      defaultExtension: 'js'
    },
    '@angular/core': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/http': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/compiler': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/common': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/platform-browser': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/platform-browser-dynamic': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    'components/*': {
      format: 'register',
      defaultExtension: 'js'
    },
    'directives': {
      format: 'register',
      defaultExtension: 'js'
    },
    'core': {
      format: 'register',
      defaultExtension: 'js'
    },
     '@angular/router-deprecated': {
       main: 'index.js',
       defaultExtension: 'js'
    },
    '@angular/router': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    'rxjs': {
      defaultExtension: 'js'
    }
  },
  files: []
});

Promise.all([
  System.import('@angular/core/testing'),
  System.import('@angular/platform-browser-dynamic/testing')
])
  .then(function (providers) {
    var testing = providers[0];
    var testingBrowser = providers[1];

    testing.setBaseTestProviders(testingBrowser.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
      testingBrowser.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);
  })
  .then(function () {
    // Finally, load all spec files.
    // This will run the tests directly.
    return Promise.all(
      allSpecFiles.map(function (moduleName) {
        return System.import(moduleName);
      }));
  }).then(__karma__.start, __karma__.error);

