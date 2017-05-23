import fs from 'fs';
import path from 'path';
import { extractDomain } from '../common/utils';
import _ from 'lodash';

import { DatabaseService } from '../common/database.service';

let rootPath = path.normalize(__dirname + '/..');

let publicPath = path.normalize(rootPath+'/../public');

const FLOW_SERVICE_HOST = process.env.FLOGO_FLOW_SERVICE_HOST || "localhost";
const FLOW_STATE_SERVICE_HOST = process.env.FLOGO_FLOW_STATE_SERVICE_HOST || "localhost";
const FLOW_WEB_HOST = extractDomain(process.env.FLOGO_FLOW_WEB_HOST || "localhost");

const FLOW_STATE_SERVICE_PORT = process.env.FLOGO_FLOW_STATE_SERVICE_PORT  || '9190';
const FLOW_SERVICE_PORT = process.env.FLOGO_FLOW_SERVICE_PORT  || '9090';
const FLOW_TESTER_PORT = process.env.FLOGO_FLOW_TESTER_PORT  || '8080';

const LOCAL_DIR = process.env.FLOGO_WEB_LOCALDIR || path.resolve('local');
// Default local/d
const DB_DIR = process.env.FLOGO_WEB_DBDIR || path.resolve(LOCAL_DIR, 'db');

const logLevel = process.env.FLOGO_WEB_LOGLEVEL || 'debug';

console.log("rootPath: ", rootPath);
console.log("publicPath: ", publicPath);

let appPort = process.env.PORT || 3303;

const enginesPath = 'local/engines';
const enginesRoot = path.join(rootPath, enginesPath);
const defaultEngineName = 'flogo-web';
const defaultEngine = `${enginesPath}/${defaultEngineName}`;

let config = {
  db: 'http://localhost:5984/flogo-web',
  cli: process.env.FLOGO_CLI || "flogo",
  rootPath: rootPath,
  publicPath: publicPath,
  logLevel,
  localPath: LOCAL_DIR,
  defaultAppJsonPath: path.join(rootPath, 'config/sample-app.json'),
  defaultFlogoDescriptorPath: process.env.FLOGO_WEB_DEFAULT_DESCRIPTOR || path.join(rootPath, 'config/default-flogo.json'),
  libVersion: process.env.FLOGO_LIB_VERSION || process.env.FLOGO_WEB_LIB_VERSION,
  app: {
    basePath: '/v1/api',
    basePathV2: '/api/v2',
    port: appPort,
    cacheTime: 0, //7 * 24 * 60 * 60 * 1000 /* default caching time (7 days) for static files, calculated in milliseconds */
    gitRepoCachePath : path.join( rootPath, 'git-cache' )
  },
  exportedAppBuild: path.join(enginesRoot, 'exported-app-build.json'),
  appBuildEngine: {
    path: `${enginesPath}/app-build`
  },
  defaultEngine: {
    path: defaultEngine,
    vendorPath: `${defaultEngineName}/vendor`,
    defaultPalette: process.env.FLOGO_WEB_DEFAULT_PALETTE || 'default-palette.json',
  },
  /* apps module config */
  apps: {
    db: "http://localhost:5984/flogo-apps",
    dbPath: path.resolve(DB_DIR, 'apps.db'),
  },
  indexer: {
    dbPath: path.resolve(DB_DIR, 'indexer.db'),
  },
  activities: {
    db: "http://localhost:5984/flogo-web-activities",
    defaultPath: "../../submodules/flogo-contrib/activity",
    contribPath: "../../contrib/activity",
    default: {
      "tibco-twilio": {
        path: "github.com/TIBCOSoftware/flogo-contrib/activity/twilio"
      },
      "tibco-coap": {
        path: "github.com/TIBCOSoftware/flogo-contrib/activity/coap"
      },
      "tibco-awsiot": {
        path: "github.com/TIBCOSoftware/flogo-contrib/activity/awsiot"
      },
      "tibco-rest": {
        path: "github.com/TIBCOSoftware/flogo-contrib/activity/rest"
      },
      "sendWSMessage":{
        path: "github.com/TIBCOSoftware/flogo-contrib/activity/wsmessage"
      },
      "tibco-gpio": {
        path: "github.com/TIBCOSoftware/flogo-contrib/activity/gpio"
      }
    },
    contrib: {}
  },
  triggers: {
    db: "http://localhost:5984/flogo-web-triggers",
    defaultPath: "../../submodules/flogo-contrib/trigger",
    contribPath: "../../contrib/trigger",
    default: {
      "tibco-mqtt": {
        path: "github.com/TIBCOSoftware/flogo-contrib/trigger/mqtt"
      },
      "tibco-timer":{
        path: "github.com/TIBCOSoftware/flogo-contrib/trigger/timer"
      },
      "tibco-coap":{
        path: "github.com/TIBCOSoftware/flogo-contrib/trigger/coap"
      },
      "tibco-rest": {
        path: "github.com/TIBCOSoftware/flogo-contrib/trigger/rest"
      }
    }
  },
  models: {
    db: "http://localhost:5984/flogo-web-models",
    defaultPath: "../../submodules/flogo-contrib/model",
    contribPath: "../../contrib/model"
  },
  testEngine: {
    path: "./",
    name: "test-engine",
    port: "8080",
    installConfig: {
      "tibco-mqtt": {
        ignore: true
      },
      "tibco-timer": {
        ignore: true
      },
      "tibco-coap":{
        ignore: true
      }
    },
    triggers: [],
    // TODO: move everything to env vars?
    config: {
      "loglevel": "DEBUG",
      "disableTriggerValidation": true,
      // flowRunner will be eventually replaced by actionRunner
      "flowRunner": {
        "type": "pooled",
        "pooled": {
          "numWorkers": 5,
          "workQueueSize": 50,
          "maxStepCount": 32000
        }
      },
      "actionRunner": {
        "type": "pooled",
        "pooled": {
          "numWorkers": 5,
          "workQueueSize": 50,
        }
      },
      "services": [{
        "name": "stateRecorder",
        "enabled": true,
        "settings": {
          "host": FLOW_STATE_SERVICE_HOST,
          "port": FLOW_STATE_SERVICE_PORT
        }
      }, {
        "name": "flowProvider",
        "enabled": true,
        "settings": {
          "host": FLOW_SERVICE_HOST,
          "port": "9090"
        }
      }, {
        "name": "engineTester",
        "enabled": true,
        "settings": {
          "port": "8080"
        }
      }]
    }
  },
  buildEngine: {
    host: "localhost",
    port: "8081",
    path: "./",
    name: "build-engine",
    installConfig: {
    },
    config: {
      "loglevel": "DEBUG",
      // flowRunner will be eventually replaced by actionRunner
      "flowRunner": {
        "type": "pooled",
        "pooled": {
          "numWorkers": 5,
          "workQueueSize": 50,
          "maxStepCount": 32000
        }
      },
      "actionRunner": {
        "type": "pooled",
        "pooled": {
          "numWorkers": 5,
          "workQueueSize": 50,
          "maxStepCount": 32000
        }
      },
      "services": [{
        "name": "stateRecorder",
        "enabled": false,
        "settings": {
          "host": FLOW_STATE_SERVICE_HOST,
          "port": FLOW_STATE_SERVICE_PORT
        }
      }, {
        "name": "flowProvider",
        "enabled": true,
        "settings": {
          "host" : FLOW_SERVICE_HOST,
          "port": FLOW_SERVICE_PORT
        }
      }, {
        "name": "engineTester",
        "enabled": true,
        "settings": {
          "port": FLOW_TESTER_PORT
        }
      }]
    }
  },
  flogoWeb: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: "5984",
    testPath: "flogo-web",
    label: 'Application database'
  },
  flogoWebActivities: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: "5984",
    testPath: "flogo-web-activities",
    label: 'Activities'
  },
  flogoWebTriggers: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: "5984",
    testPath: "flogo-web-triggers",
    label: 'Triggers'
  },
  stateServer: {
    protocol: 'http',
    host: FLOW_STATE_SERVICE_HOST,
    port: "9190",
    testPath: "ping"
  },
  processServer: {
    protocol: 'http',
    host: FLOW_SERVICE_HOST,
    port: "9090",
    testPath: "ping"
  },
  webServer: {
    protocol: 'http',
    host: FLOW_WEB_HOST,
    port: appPort,
    testPath: ''
  },
  engine: {
    protocol: 'http',
    host: 'localhost',
    port: "8080",
    testPath: "status"
  }
};

let originalConfig = _.cloneDeep(config);

export {
  config
};

export {
  originalConfig
};

const triggersDBService = new DatabaseService();
const activitiesDBService = new DatabaseService();
// let flowsDBService = new DBService(config.db);
// let appsDBService = new DBService(config.apps.db);
// let dbService = flowsDBService;

let engines = {
  "test": undefined,
  "build": undefined
};

export { triggersDBService, activitiesDBService };
// export {
//   flowsDBService
// };
// export {
//   appsDBService
// };
// export {
//   dbService
// };
export {
  engines
};

export let flowExport = {
  filename: 'flogo.export.json'
};

export function setConfiguration(newSettings) {
  let settings = _.cloneDeep(newSettings);

  config = _.assign({}, config, {
    engine: settings.engine,
    stateServer:  settings.stateServer,
    processServer: settings.flowServer,
    flogoWeb: settings.db,
    flogoWebActivities: settings.activities,
    flogoWebTriggers: settings.triggers
  });

}

export function resetConfiguration() {
  config = _.cloneDeep(originalConfig);
}


export function loadSamplesConfig() {
  let samples = [];
  try {
    //TODO: replace for async version
    samples = JSON.parse(fs.readFileSync(path.join(__dirname, 'samples.json'), 'utf8'));
  } catch(e) {
    // nothing to do
  }
  return samples;
}
