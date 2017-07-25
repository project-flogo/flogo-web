import pick from 'lodash/pick';
import get from 'lodash/get';
import defaults from 'lodash/defaults';
import fromPairs from 'lodash/fromPairs';
import isEqual from 'lodash/isEqual';
import normalizeName from 'lodash/snakeCase';
import escapeRegExp from 'lodash/escapeRegExp';

import shortid from 'shortid';

import { DEFAULT_APP_ID, DEFAULT_APP_VERSION } from '../../common/constants';
import { ErrorManager, ERROR_TYPES } from '../../common/errors';
import { CONSTRAINTS } from '../../common/validation';
import { apps as appStore } from '../../common/db';
import { logger } from '../../common/logging';
import { findGreatestNameIndex } from '../../common/utils/collection';

import { ActionsManager } from '../actions';
import { importApp } from './import.v2';
import { buildApp } from  './build';

import { Validator } from './validator';

const EDITABLE_FIELDS = [
  'name',
  'version',
  'description',
];

const PUBLISH_FIELDS = [
  'id',
  'name',
  'type',
  'version',
  'description',
  'version',
  'createdAt',
  'updatedAt',
  'triggers',
  'actions',
];

const DEFAULT_APP = {
  _id: DEFAULT_APP_ID,
  name: 'Default app',
  description: 'App created by default',
  version: DEFAULT_APP_VERSION,
};

export class AppsManager {

  static create(app) {
    let inputData = app;
    let isDevice = false;
    if(inputData.device) {
      isDevice = true;
    }
    const errors = Validator.validateSimpleApp(inputData, isDevice);
    if (errors) {
      return Promise.reject(ErrorManager.createValidationError('Validation error', errors));
    }
    inputData._id = shortid.generate();
    inputData.name = inputData.name.trim();
    inputData = build(inputData);
    return appStore.insert(inputData)
      .catch(error => {
        if (error.errorType === 'uniqueViolated') {
          logger.debug(`Name ${inputData.name} already exists, will create new name`);
          return ensureUniqueName(inputData.name)
            .then(name => {
              logger.debug(`Will use ${name}`);
              inputData.name = name;
              return appStore.insert(inputData);
            });
        }
        return Promise.reject(error);
      })
      .then(newApp => cleanForOutput(newApp));
  }

  /**
   *
   * @param appId if not provided will try to use app.id
   * @param newData {object}
   */
  static update(appId, newData) {
    const inputData = cleanInput(newData);
    return appStore
      // fetch editable fields only
      .findOne({ _id: appId }, fromPairs(EDITABLE_FIELDS.concat('_id').map(field => [field, 1])))
      .then(app => {
        if (!app) {
          throw ErrorManager.makeError('App not found', { type: ERROR_TYPES.COMMON.NOT_FOUND });
        }

        const mergedData = Object.assign({}, app, inputData);
        if (isEqual(mergedData, app)) {
          // no changes, we don't need to update anything
          return false;
        }

        const errors = Validator.validateSimpleApp(mergedData);
        if (errors) {
          throw ErrorManager.createValidationError('Validation error', { details: errors });
        }
        if (inputData.name) {
          inputData.name = inputData.name.trim();
          return validateUniqueName(inputData.name);
        }
        return true;
      })
      .then(shouldUpdate => {
        if (shouldUpdate) {
          delete inputData._id;
          return appStore.update({ _id: appId }, { $set: Object.assign({ updatedAt: nowISO() }, inputData) });
        }
        return null;
      })
      .then(() => AppsManager.findOne(appId, { withFlows: true }));

    function validateUniqueName(inputName) {
      const name = getAppNameForSearch(inputName);
      return appStore.findOne({ _id: { $ne: appId }, name: new RegExp(`^${name}$`, 'i') }, { _id: 1, name: 1 })
        .then(nameExists => {
          if (nameExists) {
            throw ErrorManager.createValidationError('Validation error', [{
              property: 'name',
              title: 'Name already exists',
              detail: 'There\'s another app with that name',
              value: inputName,
              type: CONSTRAINTS.UNIQUE,
            }]);
          }
          return true;
        });
    }
  }

  /**
   * Delete an app.
   * Will also delete related flows
   * @param appId {string} appId
   */
  static remove(appId) {
    return appStore.remove({ _id: appId })
      .then(numRemoved => {
        const wasRemoved = numRemoved > 0;
        if (wasRemoved) {
          return ActionsManager.removeFromRecentByAppId(appId)
            .then(() => wasRemoved);
        }
        return wasRemoved;
      });
  }

  /**
   * List or find all apps
   *
   * ## searchTerms
   * - name {string} find by name with exactly this name (case insensitive)
   *
   * ## options
   * - withFlows {boolean|string} get also all the related flows. Possible values:
   *    - short {string} - get short version of the flows
   *    - full {string} -  get full version of the flows
   *    - true {boolean} - same as 'short'
   *    - false {boolean} - do not get the flows
   *
   * @param terms
   * @params terms.name {string} name of the app
   * @params options
   * @params options.withFlows: retrieveFlows
   */
  static find(terms = {}, { withFlows } = { withFlows: false }) {
    if (terms.name) {
      const name = getAppNameForSearch(terms.name);
      terms.name = new RegExp(`^${name}$`, 'i');
    }

    return appStore.find(terms)
      .then(apps => apps.map(cleanForOutput));
  }

  /**
   *
   * Options:
   *    * ## options
   *    - withFlows {boolean|string} get also all the related flows. Possible values:
   *      - short {string} - get short version of the flows
   *      - full {string} -  get full version of the flows
   *      - true {boolean} - same as 'short'
   *      - false {boolean} - do not get the flows
   * @param appId
   * @param options
   * @param options.withFlows retrieve flows
   */
  static findOne(appId, { withFlows } = { withFlows: false }) {
    return appStore.findOne({ _id: appId })
      .then(app => app ? cleanForOutput(app) : null);
  }


  // TODO documentation
  static import(fromApp) {
    return importApp(fromApp);
  }

  /**
   * Build an app
   * @param appId {string} app to build
   * @params options
   * @params options.compile.os: target operating system
   * @params options.compile.arch: target architecture
   * @return {object} builded app
   * @throws Not found error if app not found
   */
  static build(appId, options) {
    return buildApp(appId, options);
  }

  /**
   * Export an app to the schema expected by cli
   * This will export apps and flows
   * @param appId {string} app to export
   * @return {object} exported object
   * @throws Not found error if app not found
   */
  static export(appId) {
    return AppsManager.findOne(appId)
      .then(app => {
        if (!app) {
          throw ErrorManager.makeError('Application not found', { type: ERROR_TYPES.COMMON.NOT_FOUND });
        }

        app.type = 'flogo:app';
        app.actions.forEach(a => {
          // TODO extract into constant
          a.ref = 'github.com/TIBCOSoftware/flogo-contrib/action/flow';
        });

        // will strip additional metadata such as createdAt, updatedAt
        const errors = Validator.validateFullApp(app, null, { removeAdditional: true, useDefaults: true });
        if (errors && errors.length > 0) {
          throw ErrorManager.createValidationError('Validation error', { details: errors });
        }

        const actionMap = new Map(app.actions.map(a => [a.id, a]));
        let handlers = [];
        app.triggers.forEach(t => {
          t.id = normalizeName(t.name);
          handlers = handlers.concat(t.handlers);
        });

        // convert to human readable action ids and update handler to point to new action id
        handlers.forEach(h => {
          const action = actionMap.get(h.actionId);
          if (!actionMap) {
            delete h.actionId;
            return;
          }
          actionMap.delete(h.actionId);
          action.id = normalizeName(action.name);
          h.actionId = action.id;
        });

        // convert orphan actions ids
        actionMap.forEach(a => {
          a.id = normalizeName(a.name);
        });

        app.actions.forEach(action => {
          const tasks = get(action, 'data.flow.rootTask.tasks', []);
          const hasExplicitReply = tasks.find(t => t.activityRef === 'github.com/TIBCOSoftware/flogo-contrib/activity/reply');
          if (hasExplicitReply) {
            action.data.flow.explicitReply = true;
          }
        });

        if(!app.version) {
          app.version =  DEFAULT_APP_VERSION;
        }

        return app;
      });
  }

  static validate(app, { clean } = { clean: false }) {
    let options;
    if (clean) {
      options = { removeAdditional: true, useDefaults: true };
    }
    return Promise.resolve(Validator.validateFullApp(app, options));
  }

  /**
   * Alias for AppsManager::find
   * @param args
   */
  static list(...args) {
    return AppsManager.find(args);
  }

}
export default AppsManager;

function getAppNameForSearch(rawName) {
  return rawName ? escapeRegExp(rawName.trim().toLowerCase()) : undefined;
}

function cleanInput(app) {
  const cleanedApp = pick(app, EDITABLE_FIELDS);
  if (cleanedApp.name) {
    cleanedApp.name = cleanedApp.name.trim();
  }
  return cleanedApp;
}

function build(app) {
  const now = (new Date()).toISOString();
  return defaults(
    app,
    { createdAt: now, updatedAt: null, triggers: [], actions: [] },
  );
}

function cleanForOutput(app) {
  const cleanedApp = Object.assign({ id: app._id }, app);
  let appDataToSend = pick(cleanedApp, PUBLISH_FIELDS);
  if(app.device) {
    appDataToSend.device = app.device;
  }
  return appDataToSend;
}

function nowISO() {
  return (new Date()).toISOString();
}

function ensureUniqueName(forName) {
  const normalizedName = escapeRegExp(forName.trim().toLowerCase());
  return appStore.find({ name: new RegExp(`^${normalizedName}`, 'i') })
    .then(apps => {
      const greatestIndex = findGreatestNameIndex(forName, apps);
      return greatestIndex < 0 ? forName : `${forName} (${greatestIndex + 1})`;
    });
}

