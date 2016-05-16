import path from 'path';
import {
  DBService
} from '../common/db.service';

let rootPath = path.normalize(__dirname + '/..');

let publicPath = path.normalize(rootPath+'/../public');

console.log("rootPath: ", rootPath);
console.log("publicPath: ", publicPath);

let config = {
  db: 'http://localhost:5984/flogo-web',
  rootPath: rootPath,
  publicPath: publicPath,
  app: {
    basePath: '/v1/api',
    port: process.env.PORT || 3010,
    cacheTime: 7 * 24 * 60 * 60 * 1000 /* default caching time (7 days) for static files, calculated in milliseconds */
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
      "tibco-awsiot":{
        path: "github.com/TIBCOSoftware/flogo-contrib/activity/awsiot"
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
    triggers: [{
      "name": "tibco-mqtt",
      "settings": {
        "topic": "flogo/#",
        "broker": "tcp://192.168.1.12:1883",
        "id": "flogoEngine",
        "user": "",
        "password": "",
        "store": "",
        "qos": "0",
        "cleansess": "false"
      },
      "endpoints": null
    }, {
      "name": "tibco-rest",
      "settings": {
        "port": "9990"
      },
      "endpoints": null
    }, {
      "name": "tibco-timer",
      "settings": {},
      "endpoints": null
    }],
    config: {
      "loglevel": "DEBUG",
      "flowRunner": {
        "type": "pooled",
        "pooled": {
          "numWorkers": 5,
          "workQueueSize": 50,
          "maxStepCount": 32000
        }
      },
      "services": [{
        "name": "stateRecorder",
        "enabled": true,
        "settings": {
          "host": "localhost",
          "port": "9190"
        }
      }, {
        "name": "flowProvider",
        "enabled": true
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
      "flowRunner": {
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
          "host": "localhost",
          "port": "9190"
        }
      }, {
        "name": "flowProvider",
        "enabled": true
      }, {
        "name": "engineTester",
        "enabled": true,
        "settings": {
          "port": "8081"
        }
      }]
    }
  },
  stateServer: {
    host: "localhost",
    port: "9190"
  },
  processServer: {
    host: "localhost",
    port: "9090"
  }
};

export {
  config
};

let triggersDBService = new DBService(config.triggers.db);
let activitiesDBService = new DBService(config.activities.db);
let dbService = new DBService(config.db);

let engines = {
  "test": undefined,
  "build": undefined
};

export {
  triggersDBService
};
export {
  activitiesDBService
};
export {
  dbService
};
export {
  engines
};

export let flowExport = {
  filename: 'flogo.export.json'
};
