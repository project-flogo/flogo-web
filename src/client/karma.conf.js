// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

function getReporters(config) {
  if (process.env.TRAVIS) {
    return ['mocha'];
  }
  return config.angularCli && config.angularCli.codeCoverage
    ? ['progress', 'coverage-istanbul']
    : ['progress', 'kjhtml']
}

module.exports = function (config) {
  const isTestEnv = process.env.FG_ENV === 'test';

  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular/cli'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular/cli/plugins/karma'),
      require('karma-mocha-reporter')
    ],
    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      { pattern: './test.ts', watched: false }
    ],
    preprocessors: {
      './test.ts': ['@angular/cli']
    },
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    coverageIstanbulReporter: {
      reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    angularCli: {
      environment: 'dev'
    },
    reporters: getReporters(config),
    // reporter options
    mochaReporter: {
      // output: isTestEnv ? 'minimal' : 'full'
    },
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'ChromeHeadless',
        flags: [
          '--headless',
          '--disable-gpu',
          // Without a remote debugging port, Google Chrome exits immediately.
          '--remote-debugging-port=9222',
        ]
      }
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: process.env.TRAVIS ?  ['Chrome_travis_ci'] : ['Chrome'],
    singleRun: false
  });
};
