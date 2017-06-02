const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

const ps = require('ps-node');

import {fileExists} from '../../common/utils/file';
import {config} from '../../config/app-config';

module.exports = {
  start(enginePath, engineName, options) {
    options = Object.assign({}, options, { binDir: 'bin' });

    console.log( `[info] starting engine ${engineName}` );

    return new Promise( ( resolve, reject ) => {

      let binPath = path.join(enginePath, options.binDir);
      console.log( '[info] defaultEngineBinPath: ', binPath );
      // TODO: cross platform execution?
      let command = `./${engineName}`;
      console.log( '[info] command: ', command );

      if ( !fileExists( path.join( binPath, engineName ) ) ) {
        console.log( `[error] engine ${engineName} doesn't exist` );
        reject( new Error( `[error] engine ${engineName} doesn't exist` ) );
      } else {
        const settings = config.buildEngine.config.services || [];

        const stateRecorder = settings.find((service)=> service.name === 'stateRecorder');
        const engineTester = settings.find((service)=> service.name === 'engineTester');

        const env =  Object.assign( {
          LOG_LEVEL: 'DEBUG',
          LOG_DATETIME_FORMAT: '',
          TESTER_ENABLED: 'true',
          TESTER_PORT: engineTester.settings.port,
          TESTER_SR_SERVER: stateRecorder.settings.host + ':' + stateRecorder.settings.port
        });

        let engineProcess = spawn(command, {
          cwd: binPath,
          env: Object.assign(
            env, process.env),
        });

        _setupLogging(engineProcess, engineName, options);

        resolve(engineProcess);
      }
    } );
  },
  stop(name) {

    return new Promise(function (resolve, reject) {
      ps.lookup({
        command: name
      }, function(err, resultList) {
        if (err) {
          return reject(new Error(err));
        }

        let process = resultList.shift();
        if(process) {
          console.log( '[info] Stop engine PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
          ps.kill(process.pid, function( err ) {
            if (err) {
              return reject(new Error( err ));
            } else {
              console.log( '[info] Stop engine Process %s has been killed!', process.pid );
              resolve(true);
            }
          });
        } else {
          resolve(false);
        }

      });

    });
  }
};

function _setupLogging(engineProcess, engineName, options) {
  if (options.logger) {
    let logger = options.logger;
    logger.registerDataStream(engineProcess.stdout, engineProcess.stderr);
  } else if (options.logPath) {
    let logFile = path.join(options.logPath, engineName + '.log' );
    let logStream = fs.createWriteStream( logFile, { flags : 'a' } );
    console.log( '[info] engine logFile: ', logFile );
    // log engine output
    engineProcess.stdout.pipe( logStream );
    engineProcess.stderr.pipe( logStream );
  } else {
    console.warn('[warning] no logging setup for engine run');
  }
}
