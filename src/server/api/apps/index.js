import { config } from '../../config/app-config';
import { AppsManager } from '../../modules/apps';
import { ErrorManager, ERROR_TYPES } from '../../common/errors';
import { retrieveJsonFromRequest } from './../../common/utils';

const basePath = config.app.basePath;

export function apps(app, router) {
  if (!app) {
    console.error(new Error('Missing app" parameter'));
  }

  router.get(`${basePath}/apps`, listApps);
  router.post(`${basePath}/apps`, createApp);

  router.get(`${basePath}/apps/:appId`, getApp);
  router.put(`${basePath}/apps/:appId`, updateApp);
  router.patch(`${basePath}/apps/:appId`, updateApp);
  router.del(`${basePath}/apps/:appId`, deleteApp);

  router.get(`${basePath}/apps/:appId/export`, exportApp);

  router.post(`${basePath}/apps/import`, importApp);
}
export default apps;

// TODO add documentation
function* importApp() {
  let importedAppJSON;

  try {
    importedAppJSON = retrieveJsonFromRequest(this);
    let params = this.query || {};
    if (params.name) {
      importedAppJSON.name = params.name.trim();
    }

    const app = yield AppsManager.import(importedAppJSON) ;
    this.body = {
      data: app,
    };
  } catch (error) {
    if (error.isOperational && error.type === ERROR_TYPES.COMMON.VALIDATION) {
      throw ErrorManager.createRestError('Validation error in /apps uploadApp', {
        status: 400,
        title: 'Validation error',
        detail: 'There were one or more validation problems',
        meta: ErrorManager.validationToRestErrors(error.details.errors),
      });
    }
    throw error;
  }
}

/**
 */
function* listApps() {
  const searchTerms = {};
  const filterName = this.request.query['filter[name]'];
  if (filterName) {
    searchTerms.name = filterName;
  }

  const foundApps = yield AppsManager.find(searchTerms);
  this.body = {
    data: foundApps || [],
  };
}

function* createApp() {
  // throw error if it is not json?
  const data = this.request.body || {};

  try {
    const app = yield AppsManager.create(data);
    this.body = {
      data: app,
    };
  } catch (error) {
    if (error.isOperational && error.type === ERROR_TYPES.COMMON.VALIDATION) {
      throw ErrorManager.createRestError('Validation error in /apps getApp', {
        status: 400,
        title: 'Validation error',
        detail: 'There were one or more validation problems',
        meta: ErrorManager.validationToRestErrors(error.details.errors),
      });
    }

    throw error;
  }
}

function* getApp() {
  const appId = this.params.appId;

  const app = yield AppsManager.findOne(appId, { withFlows: 'short' });

  if (!app) {
    throw ErrorManager.createRestNotFoundError('Application not found', {
      title: 'Application not found',
      detail: 'No application with the specified id',
    });
  }

  this.body = {
    data: app,
  };
}


function* updateApp() {
  try {
    const appId = this.params.appId;
    const data = this.request.body || {};
    const app = yield AppsManager.update(appId, data);

    this.body = {
      data: app,
    };
  } catch (error) {
    if (error.isOperational) {
      if (error.type === ERROR_TYPES.COMMON.VALIDATION) {
        throw ErrorManager.createRestError('Validation error in /apps getApp', {
          status: 400,
          title: 'Validation error',
          detail: 'There were one or more validation problems',
          meta: ErrorManager.validationToRestErrors(error.details.errors),
        });
      } else if (error.type === ERROR_TYPES.COMMON.NOT_FOUND) {
        throw ErrorManager.createRestNotFoundError('Application not found', {
          title: 'Application not found',
          detail: 'No application with the specified id',
        });
      }
    }
    throw error;
  }
}


function* deleteApp() {
  const appId = this.params.appId;

  const app = yield AppsManager.remove(appId);

  if (!app) {
    throw ErrorManager.createRestNotFoundError('Application not found', {
      title: 'Application not found',
      detail: 'No application with the specified id',
    });
  }

  this.status = 204;
}

function* exportApp() {
  const appId = this.params.appId;

  try {
    this.body = yield AppsManager.export(appId);
  } catch (error) {
    if (error.type === ERROR_TYPES.COMMON.NOT_FOUND) {
      throw ErrorManager.createRestNotFoundError('Application not found', {
        title: 'Application not found',
        detail: 'No application with the specified id',
      });
    }
    throw error;
  }


}

