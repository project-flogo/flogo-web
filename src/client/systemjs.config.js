/*
 * This config is only used during development and build phase only
 * It will not be available on production
 *
 */

// We define the configuration for development environment and we adjust it for the building phase
(function (global) {
  // ENV
  var isDevEnv = typeof global.DEV != 'undefined' && global.DEV;

  // packages tells the System loader how to load when no filename and/or no extension
  // REMEMBER to also add your add library to be loaded in map config in production section below
  var packages = {
    //'rxjs': {
    //  defaultExtension: 'js'
    //},
    'ng2-bs3-modal': {
      defaultExtension: false
    }//,
    //'ng2-translate': {
    //  defaultExtension: 'js'
   // }
  };

  var paths;
  var map;
  var defaultJSExtensions = 'js';

  if(isDevEnv) {
    paths = {
      'main': '/main',
      'n:*': '/node_modules/*',
      "ng2-translate/ng2-translate": "/node_modules/ng2-translate/bundles/ng2-translate.js"
    };

    // map tells the System loader where to look for things
    // load angular from node_modules folder
    map = {
      '@angular': 'n:@angular',
      //'ng2-translate': 'n:ng2-translate'
    };

    //packages['ng2-translate'].main =  'bundles/ng2-translate';

  } else {

    // wildcard paths
    paths = {
      'n:*': 'src/client/node_modules/*'
    };

    // map tells the System loader where to look for things
    map = {
      'main': 'dist/public/build',
      'rxjs': 'n:rxjs',
      'ng2-bs3-modal': 'n:ng2-bs3-modal',
      '@angular': 'n:@angular',
      'ng2-translate': 'n:ng2-translate'
    };

    defaultJSExtensions = false;
    // fix default extensions
    for (var pkgName in packages) {
      packages[pkgName].defaultExtension = 'js';
    }

    packages['main'] =  {
      main: 'main',
      defaultExtension: 'js'
    };

  }


  // Register @angular submodules
  var ngPackageNames = [
    'common',
    'compiler',
    'core',
    'forms',
    'http',
    'platform-browser',
    'platform-browser-dynamic',
    'router'
  ];

  ngPackageNames.forEach(function (pkgName) {
    packages['@angular/' + pkgName] = {
      main: isDevEnv ? 'bundles/' + pkgName + '.umd.js' : 'esm/index.js',
      defaultExtension: 'js'
    };
  });

  var config = {
    defaultJSExtensions: defaultJSExtensions,
    map: map,
    packages: packages,
    paths: paths
  };

  // filterSystemConfig - index.html's chance to modify config before we register it.
  if (global.filterSystemConfig) {
    global.filterSystemConfig(config);
  }

  System.config(config);

})(this);
