import _ from 'lodash';
import fs from 'fs';
import path from 'path';

const rootPath = path.resolve(__dirname, '..');
const publicPath = path.resolve(rootPath, '..', 'public');

const FLOW_SERVICE_HOST = process.env.FLOGO_FLOW_SERVICE_HOST || 'localhost';
const FLOW_STATE_SERVICE_HOST = process.env.FLOGO_FLOW_STATE_SERVICE_HOST || 'localhost';
const FLOW_WEB_HOST = __extractDomain(process.env.FLOGO_FLOW_WEB_HOST || 'localhost');

const FLOW_STATE_SERVICE_PORT = process.env.FLOGO_FLOW_STATE_SERVICE_PORT || '9190';
const FLOW_SERVICE_PORT = process.env.FLOGO_FLOW_SERVICE_PORT || '9090';
const FLOW_TESTER_PORT = process.env.FLOGO_FLOW_TESTER_PORT || '8080';

const LOCAL_DIR = process.env.FLOGO_WEB_LOCALDIR || path.resolve('local');
// Default local/d
const DB_DIR = process.env.FLOGO_WEB_DBDIR || path.resolve(LOCAL_DIR, 'db');

const logLevel = process.env.FLOGO_WEB_LOGLEVEL || 'debug';

console.log('rootPath: ', rootPath);
console.log('publicPath: ', publicPath);

const appPort = process.env.PORT || 3303;

const enginesPath = path.join('local', 'engines');
const enginesRoot = path.join(rootPath, enginesPath);
const defaultEngineName = 'flogo-web';
const defaultEngine = path.join(enginesPath, defaultEngineName);

let libVersion = process.env.FLOGO_LIB_VERSION || process.env.FLOGO_WEB_LIB_VERSION;
if (!libVersion || libVersion === 'latest') {
  libVersion = 'master';
}

const config = {
  db: 'http://localhost:5984/flogo-web',
  rootPath,
  publicPath,
  logLevel,
  localPath: LOCAL_DIR,
  defaultAppJsonPath: path.join(rootPath, 'config', 'sample-app.json'),
  defaultContribsPath: path.join(rootPath, 'config', 'default-devices-contrib.json'),
  defaultFlogoDescriptorPath: process.env.FLOGO_WEB_DEFAULT_DESCRIPTOR || path.join(rootPath, 'config', 'default-flogo.json'),
  libVersion,
  app: {
    basePath: '/v1/api',
    basePathV2: '/api/v2',
    port: appPort,
    // 7 * 24 * 60 * 60 * 1000 /* default caching time (7 days) for static files, calculated in milliseconds */
    cacheTime: 0,
    gitRepoCachePath: path.join(rootPath, 'git-cache'),
  },
  exportedAppBuild: path.join(enginesRoot, 'exported-app-build.json'),
  appBuildEngine: {
    path: path.resolve(enginesPath, 'app-build'),
  },
  defaultEngine: {
    path: defaultEngine,
    vendorPath: `${defaultEngineName}/vendor`,
    defaultPalette: process.env.FLOGO_WEB_DEFAULT_PALETTE || 'default-palette.json',
  },
  /* apps module config */
  // TODO: consolidate and cleanup
  apps: {
    dbPath: path.resolve(DB_DIR, 'apps.db'),
  },
  indexer: {
    dbPath: path.resolve(DB_DIR, 'indexer.db'),
  },
  contribs: {
    dbPath: path.resolve(DB_DIR, 'contribs.db'),
  },
  buildEngine: {
    host: 'localhost',
    port: '8081',
    path: './',
    name: 'build-engine',
    installConfig: {
    },
    config: {
      loglevel: 'DEBUG',
      // flowRunner will be eventually replaced by actionRunner
      flowRunner: {
        type: 'pooled',
        pooled: {
          numWorkers: 5,
          workQueueSize: 50,
          maxStepCount: 32000,
        },
      },
      actionRunner: {
        type: 'pooled',
        pooled: {
          numWorkers: 5,
          workQueueSize: 50,
          maxStepCount: 32000,
        },
      },
      services: [{
        name: 'stateRecorder',
        enabled: false,
        settings: {
          host: FLOW_STATE_SERVICE_HOST,
          port: FLOW_STATE_SERVICE_PORT,
        },
      }, {
        name: 'flowProvider',
        enabled: true,
        settings: {
          host: FLOW_SERVICE_HOST,
          port: FLOW_SERVICE_PORT,
        },
      }, {
        name: 'engineTester',
        enabled: true,
        settings: {
          port: FLOW_TESTER_PORT,
        },
      }],
    },
  },
  flogoWeb: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: '5984',
    testPath: 'flogo-web',
    label: 'Application database',
  },
  flogoWebActivities: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: '5984',
    testPath: 'flogo-web-activities',
    label: 'Activities',
  },
  flogoWebTriggers: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: '5984',
    testPath: 'flogo-web-triggers',
    label: 'Triggers',
  },
  stateServer: {
    protocol: 'http',
    host: FLOW_STATE_SERVICE_HOST,
    port: '9190',
    basePath: '/v1',
    testPath: '/v1/ping',
  },
  processServer: {
    protocol: 'http',
    host: FLOW_SERVICE_HOST,
    port: '9090',
    testPath: 'ping',
  },
  webServer: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: appPort,
    testPath: '',
  },
  engine: {
    protocol: 'http',
    host: 'localhost',
    port: '8080',
    testPath: 'status',
  },
};

const originalConfig = _.cloneDeep(config);

export {
  config,
};

export {
  originalConfig,
};

export const flowExport = {
  filename: 'flogo.export.json',
};

export function setConfiguration(newSettings) {
  const settings = _.cloneDeep(newSettings);

  config = _.assign({}, config, {
    engine: settings.engine,
    stateServer: settings.stateServer,
    processServer: settings.flowServer,
    flogoWeb: settings.db,
    flogoWebActivities: settings.activities,
    flogoWebTriggers: settings.triggers,
  });
}

export function resetConfiguration() {
  config = _.cloneDeep(originalConfig);
}

export function loadSamplesConfig() {
  let samples = [];
  try {
    // TODO: replace for async version
    samples = JSON.parse(fs.readFileSync(path.join(__dirname, 'samples.json'), 'utf8'));
  } catch (e) {
    // nothing to do
  }
  return samples;
}


function __extractDomain(url) {
  let domain;
  if (url.indexOf('://') > -1) {
    domain = url.split('/')[2];
  } else {
    domain = url.split('/')[0];
  }
  domain = domain.split(':')[0];
  return domain;
}
