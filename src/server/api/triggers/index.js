import {config, triggersDBService} from '../../config/app-config';
import { TYPE_TRIGGER, DEFAULT_PATH_TRIGGER } from '../../common/constants';
import { RemoteInstaller } from '../../modules/remote-installer';
import { inspectObj } from '../../common/utils';
import path from 'path';
import { getInitializedEngine } from '../../modules/engine';
import { TriggerManager } from '../../modules/triggers';

let basePath = config.app.basePath;

let remoteInstaller = new RemoteInstaller( {
  type : TYPE_TRIGGER,
  registerPath : path.join( config.rootPath, DEFAULT_PATH_TRIGGER )
} );

export function triggers(app, router){
  if(!app){
    console.error("[Error][api/triggers/index.js]You must pass app");
  }
  router.get(basePath+"/triggers", listTriggers);
  router.post(basePath+"/triggers", installTriggers);
  router.delete(basePath+"/triggers", deleteTriggers);
}

/**
 * @swagger
 *  /triggers:
 *    get:
 *      tags:
 *        - Trigger
 *      summary: Get all the triggers installed in the engine.
 *      responses:
 *        '200':
 *          description: All triggers obtained successfully.
 *          schema:
 *            type: array
 *            items:
 *              $ref: '#/definitions/Trigger'
 */
function* listTriggers() {
  const searchTerms = {};
  const filterName     = this.request.query['filter[name]'];
  const filterWhereURL = this.request.query['filter[whereURL]'];

  if (filterName)     { searchTerms.name     = filterName;     }
  if (filterWhereURL) { searchTerms.whereURL = filterWhereURL; }

  const foundTriggers = yield TriggerManager.find(searchTerms);
  this.body = {
    data: foundTriggers || [],
  };
}

/**
 * @swagger
 * /triggers:
 *    post:
 *      tags:
 *        - Trigger
 *      summary: Install new Triggers in the engine
 *      parameters:
 *        - name: urls
 *          in: body
 *          description: Urls to the triggers to be installed
 *          required: true
 *          schema:
 *            $ref: '#/definitions/Urls'
 *      responses:
 *        '200':
 *          description: New triggers installed successfully
 */
function* installTriggers( next ) {
  let urls = preProcessURLs( this.request.body.urls );

  console.log( '[log] Install Triggers' );
  inspectObj( urls );

  let testEngine = yield getInitializedEngine(config.defaultEngine.path);
  let results = {};
  if ( testEngine ) {

    console.log( `[log] adding triggers to test engine...` );

    let stopTestEngineResult = yield testEngine.stop();

    if ( !stopTestEngineResult ) {
      throw new Error( '[error] Encounter error to stop test engine.' );
    }

    try {
      results = yield remoteInstaller.install( urls, {engine: testEngine} );
      console.log( '[log] Installation results' );
      inspectObj( {
        success : results.success,
        fail : results.fail
      } );
    } catch ( err ) {
      console.error( `[error] add triggers to test engine` );
      console.error( err );
      throw new Error( '[error] Encounter error to add triggers to test engine.' );
    }

    let testEngineBuildResult = yield testEngine.build();

    if ( !testEngineBuildResult ) {
      throw new Error( '[error] Encounter error to build test engine after adding triggers.' );
    }

    let testEngineStartResult = yield testEngine.start();

    if ( !testEngineStartResult ) {
      throw new Error( '[error] Encounter error to start test engine after adding triggers.' );
    }
  }

  delete results.details; // keep the details internally.

  this.body = results;

  yield next;

}

/**
 * @swagger
 *  /triggers:
 *    delete:
 *      tags:
 *        - Trigger
 *      summary: Not implemented yet
 *      responses:
 *        '200':
 *          description: To be defined
 */
function* deleteTriggers( next ) {

  console.log( '------- ------- -------' );
  console.log( 'Delete Triggers' );
  console.log( this.request.body.urls );
  this.body = 'TODO';
  console.log( '------- ------- -------' );

  yield next;
}
function preProcessURLs( urls ) {
  'use strict';
  // TODO
  return urls;
}
/**
 * @swagger
 * definition:
 *  Trigger:
 *    type: object
 *    properties:
 *      name:
 *        type: string
 *      version:
 *        type: string
 *      description:
 *        type: string
 *      title:
 *        type: string
 *      settings:
 *        type: array
 *        items:
 *          $ref: '#/definitions/Attribute'
 *      outputs:
 *        type: array
 *        items:
 *          $ref: '#/definitions/Attribute'
 *      endpoint:
 *        type: object
 *        properties:
 *          settings:
 *            type: array
 *            items:
 *              $ref: '#/definitions/Attribute'
 */

