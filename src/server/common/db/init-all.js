import {
  flowsDBService,
  activitiesDBService,
  triggersDBService,
  appsDBService
} from '../../config/app-config';


/**
 * Init all dbs
 * @returns {Promise.<*>} Resolves when all databases are initialized
 */
export function initAllDbs() {

  return Promise.all([
    activitiesDBService.init(),
    triggersDBService.init(),
    flowsDBService.init(),
    appsDBService.init()
  ]);

}
