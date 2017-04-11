var fs = require('fs');
var path = require('path');

import {readJSONFile, listFiles} from '../../common/utils/file';

const TASK_SRC_ROOT = 'vendor/src';
const DIR_NAME_UI = 'ui';

module.exports = {
  exists(enginePath) {
    return new Promise((resolve, reject) => {
      fs.stat(enginePath, (err, stats) => {
        if (err && err.code === 'ENOENT') {
          return resolve(false);
        } else if (err) {
          return reject(err);
        }
        if (stats.isFile() || stats.isDirectory()) {
          return resolve(true);
        }
      });
    });
  },
  readFlogo,
  readAllTasks(enginePath, taskData){
    var taskDataPromise;

    if (!taskData) {
      taskDataPromise = readFlogo(enginePath);
    } else {
      taskDataPromise = Promise.resolve(taskData);
    }

    return taskDataPromise.then(function dataTransformer(data) {
      return Promise.all([
        _readTasks(enginePath, 'trigger', data.triggers),
        _readTasks(enginePath, 'activity', data.activities)
      ]).then(function (result) {
        return {
          triggers: result[0],
          activities: result[1]
        };
      });
    });
  },
  readAllFlowNames(enginePath) {
    return listFiles(path.resolve(enginePath, 'flows'));
  }
};

function readFlogo(enginePath) {
  return readJSONFile(path.join(enginePath, 'flogo.json'));
}

function _readTasks(enginePath, type, data) {
  if (!data) {
    return Promise.resolve([]);
  }

  return Promise.all(data.map(function (taskInfo) {
      return readJSONFile(path.join(enginePath, TASK_SRC_ROOT, taskInfo.path, `${type}.json`))
      .then(schema => Object.assign({}, taskInfo, { rt: schema }));
  }));
}
