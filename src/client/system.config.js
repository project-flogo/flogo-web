/*
 * This config is only used during development and build phase only
 * It will not be available on production
 *
 */

(function(global) {
  // ENV
  //global.ENV = 'development'

  // wildcard paths
  var paths = {
    'n:*': 'src/client/node_modules/*'
  };

  // map tells the System loader where to look for things
  var map = {
    'main': 'dist/public',
    'rxjs': 'n:rxjs',
    '@angular': 'n:@angular',
    'ng2-bs3-modal': 'n:ng2-bs3-modal'//,
    //'lodash': 'n:lodash'
  };

  // packages tells the System loader how to load when no filename and/or no extension
  var packages = {
    'main': {
      defaultExtension: 'js'
    },
    'rxjs': {
      defaultExtension: 'js'
    },
    'ng2-bs3-modal': {
      defaultExtension: 'js'
    }
  };

  var packageNames = [
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/http',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router-deprecated'
    //'lodash'
  ];

  // add package entries for angular packages in the form '@angular/common': { main: 'index.js', defaultExtension: 'js' }
  packageNames.forEach(function(pkgName) {
    packages[pkgName] = { main: 'index.js', defaultExtension: 'js' };
  });

  var config = {
    defaultJSExtensions: true,
    map: map,
    packages: packages,
    paths: paths
  };

  // filterSystemConfig - index.html's chance to modify config before we register it.
  if (global.filterSystemConfig) { global.filterSystemConfig(config); }

  System.config(config);

})(this);
