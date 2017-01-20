import {
  activitiesDBService,
  flowsDBService,
  triggersDBService,
  appsDBService
} from '../../config/app-config';

import { initViews as initAppViews } from './apps';
import { initViews as initFlowsViews } from './flows';
import { initViews as initTriggersViews } from './triggers';
import { initViews as initActivitiesTriggers } from './activities';

/**
 * Create all the views
 * @returns {Promise.<*>} Resolves when all views are created
 */
export function createViews() {

  return Promise.all([
      initTriggersViews(triggersDBService.db),
      initFlowsViews(flowsDBService.db),
      initAppViews(appsDBService.db),
      initActivitiesTriggers(activitiesDBService.db)
  ]);

}
