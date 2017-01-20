import path from 'path';

import 'babel-polyfill';
import {config, activitiesDBService, triggersDBService} from '../../config/app-config';

import {RegisterActivities} from '../activities/register-activites';
import {RegisterTriggers} from '../triggers/register-triggers';

/*
 * Server start logic
 *
 * 1. register default activities and triggers.
 * 2. initialise the default engine (the test engine) and build engine.
 * 3. start the test engine.
 * 4. configure the server and start listening
 */

export function syncTasks(engine) {
  let registerActivitiesPromise = (() => {
    return new Promise( ( resolve, reject ) => {
      const reg = new RegisterActivities( activitiesDBService, {
        defaultPath : path.resolve( config.rootPath, config.activities.defaultPath ),
        defaultConfig : config.activities.default,
        customPath : path.resolve( config.rootPath, config.activities.contribPath ),
        customConfig : config.activities.contrib
      } );

      //return reg.register()
      return reg.cleanDB()
        .then(() => reg.syncDb(engine.getActivities()))
        .then( ()=> {
          console.log( "[success]registerActivities success" );
          resolve( true );
        } )
        .catch( ( err )=> {
          console.log( "[error]registerActivities error" );
          reject( err );
        } );
    } );
  })();

  let registerTriggersPromise = (()=> {
    return new Promise( ( resolve, reject ) => {
      const reg = new RegisterTriggers( triggersDBService, {
        defaultPath : path.resolve( config.rootPath, config.triggers.defaultPath ),
        defaultConfig : config.triggers.default,
        customPath : path.resolve( config.rootPath, config.triggers.contribPath ),
        customConfig : config.triggers.contrib
      } );

      //return reg.register()
      return reg.cleanDB()
        .then(() => reg.syncDb(engine.getTriggers()))
        .then( ()=> {
          console.log( "[success]registerTriggers success" );
          resolve( true );
        } )
        .catch( ( err )=> {
          console.log( "[error]registerTriggers error" );
          reject( err );
        } );
    } );
  })();

  return Promise.all( [ registerActivitiesPromise, registerTriggersPromise ] );

}

