import { AppsManager } from '../../modules/apps/index.v2';
import { ErrorManager, ERROR_TYPES } from '../../common/errors';

export function apps(router, basePath) {
  router.get(`${basePath}/apps`, listApps);
  router.post(`${basePath}/apps`, createApp);
  router.post(`${basePath}/apps\\:import`, importApp);

  // ex. /apps/zA45E:export
  // needs to be registered before .get('/apps/:appId')
  router.get(`${basePath}/apps/:appId\\:export`, exportApp);
  router.get(`${basePath}/apps/:appId/build`, buildApp);

  router.get(`${basePath}/apps/:appId`, getApp);
  router.patch(`${basePath}/apps/:appId`, updateApp);
  router.del(`${basePath}/apps/:appId`, deleteApp);

  // /apps:validate
  router.post(`${basePath}/apps\\:validate`, validateApp);
}

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
  const body = this.request.body;
  try {
    const app = yield AppsManager.create(body);
    this.body = {
      data: app,
    };
  } catch (error) {
    if (error.isOperational && error.type === ERROR_TYPES.COMMON.VALIDATION) {
      throw ErrorManager.createRestError('Validation error in /apps createApp', {
        status: 400,
        title: 'Validation error',
        detail: 'There were one or more validation problems',
        meta: error.details.errors,
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
          meta: error.details.errors,
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
  const removed = yield AppsManager.remove(appId);

  if (!removed) {
    throw ErrorManager.createRestNotFoundError('Application not found', {
      title: 'Application not found',
      detail: 'No application with the specified id',
    });
  }

  this.status = 204;
}

function* importApp() {
  try {
    console.log('usinfg', this.request.body);
    this.body = yield AppsManager.import(this.request.body);
  } catch (error) {
    if (error.isOperational) {
      if (error.type === ERROR_TYPES.COMMON.VALIDATION) {
        throw ErrorManager.createRestError('Validation error in /apps getApp', {
          status: 400,
          title: 'Validation error',
          detail: 'There were one or more validation problems',
          meta: error.details.errors,
        });
      }
    }
    throw error;
  }
}

function* buildApp() {
  const appId = this.params.appId;
  const options = { compile: {} };

  options.compile.os = this.query.os     || null;
  options.compile.arch = this.query.arch || null;

  this.body = yield AppsManager.build(appId, options);
}

function* exportApp() {
  const appId = this.params.appId;
  const type = this.request.query['type'];
  const flowIds = this.request.query['flowids'];
  const flowIdArray = flowIds ? flowIds.split(',') : null;

  try {
    this.body = yield AppsManager.export(appId, type, flowIdArray);
  } catch (error) {
    if (error.isOperational) {
      if (error.type === ERROR_TYPES.COMMON.VALIDATION) {
        throw ErrorManager.createRestError('Validation error in /apps getApp', {
          status: 400,
          title: 'Validation error',
          detail: 'There were one or more validation problems',
          meta: error.details.errors,
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

function* validateApp() {
  const data = this.request.body || {};
  const errors = yield AppsManager.validate(data, { clean: true });
  this.status = 200;
  if (errors && errors.length > 0) {
    this.status = 400;
    this.body = {
      errors,
    };
  } else {
    this.status = 200;
    this.body = data;
  }
}
