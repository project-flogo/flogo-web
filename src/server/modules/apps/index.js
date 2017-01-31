import pick from 'lodash/pick';
import defaults from 'lodash/defaults';
import kebabCase from 'lodash/kebabCase';

import { DEFAULT_APP_ID } from '../../common/constants';

import { appsDBService } from '../../config/app-config';
import { VIEWS } from '../../common/db/apps';
import { ErrorManager, ERROR_TYPES } from '../../common/errors';
import { CONSTRAINTS } from '../../common/validation';
import { FlowsManager } from '../flows';
import { importFlows } from './import';
import { consolidateFlowsAndTriggers } from './export';

/*
app:
  properties:
    id:
      type: string
    name:
      type: string
      required: true
    normalizedName:
      type: string
      readOnly: true
    version:
      type: string
    description:
      type: string
    createdAt:
      type: string
      format: dateTime
      readOnly: true
    updatedAt:
      type: string
      format: dateTime
      readOnly: true
    flows:
      type: array
      readOnly: true
 */

const EDITABLE_FIELDS = [
  'name',
  'version',
  'description',
];

const PUBLISH_FIELDS = [
  'id',
  'name',
  'normalizedName',
  'version',
  'description',
  'version',
  'createdAt',
  'updatedAt',
];

const DEFAULT_APP = {
  _id: DEFAULT_APP_ID,
  name: 'Default app',
  description: 'App created by default',
  version: '0.0.1',
};

export class AppsManager {

  static create(app) {
    const inputData = app;
    let cleanApp = cleanInput(inputData);

    return validate(cleanApp).then(() => {
      cleanApp = build(cleanApp);
      return appsDBService.db
        .post(cleanApp)
        .then(response => AppsManager.findOne(response.id, { withFlows: true }));
    });
  }

  // TODO documentation
  static import(importedJSON) {

    return this.create(importedJSON)
           .then((app)=> {
             console.log('@The app created is:');
             console.log(app);
             let {triggers, actions} = importedJSON;
             let importedFlows = Object.assign({},{createdApp:app}, {triggers , actions}  );
             return importFlows(importedFlows);
            })
          .catch((error)=> {
            throw error;
          });
  }

  /**
   * Export an app to the schema expected by cli
   * This will export apps and flows
   * @param appId {string} app to export
   * @return {object} exported object
   * @throws Not found error if app not found
   */
  static export(appId) {
    return AppsManager.findOne(appId, { withFlows: 'raw' })
      .then((app) => {
        if (!app) {
          throw ErrorManager.makeError('Application not found', { type: ERROR_TYPES.COMMON.NOT_FOUND });
        }
        return Promise.all([
          app,
          FlowsManager.convertManyToCliSchema({ appId }),
        ]);
      })
      .then((data) => {
        const [app, flowsData] = data;
        const consolidatedData = consolidateFlowsAndTriggers(flowsData);
        return {
          name: app.name,
          type: 'flogo:app',
          version: app.version || '0.0.1',
          description: app.description,
          triggers: consolidatedData.triggers,
          actions: consolidatedData.flows,
        };
      });
  }

  /**
   *
   * @param appId if not provided will try to use app.id
   * @param newData {object}
   */
  static update(appId, newData) {
    return appsDBService.db.get(appId)
      .then((response) => {
        const cleanNewData = cleanInput(newData);
        let app = Object.assign(response, cleanNewData);

        return validate(app).then(() => {
          app = build(app);
          app.updatedAt = (new Date()).toISOString();
          return appsDBService.db
            .put(app)
            .then(saveResponse => AppsManager.findOne(saveResponse.id, { withFlows: true }));
        });
      })
      .catch((error) => {
      // TODO: if conflict: repeat
        if (error.name === 'not_found') {
          throw ErrorManager.makeError('App not found', { type: ERROR_TYPES.COMMON.NOT_FOUND });
        }
        throw error;
      });
  }

  /**
   * Delete an app.
   * Will also delete related flows
   * @param appId {string} appId
   */
  static remove(appId) {
    return FlowsManager.removeByAppId(appId)
      .then(() => appsDBService.db.get(appId)
          .then(app => appsDBService.db.remove(app))
          .then(() => true)
          .catch((err) => {
            if (err.name === 'not_found') {
              return Promise.resolve(null);
            }
            throw err;
          }));
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
    const options = { include_docs: true };
    if (terms.name) {
      options.key = getAppNameForSearch(terms.name);
    }
    return appsDBService.db
      .query(`views/${VIEWS.name}`, options)
      .then(result => (result.rows || [])
        .map(appRow => cleanForOutput(appRow.doc)),
      )
      .then(apps => (withFlows ? augmentWithFlows(apps, withFlows) : apps));
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
    /*
     1. find app with the specified id
     1.1 if app exists retrieve related flows if applicable (based on withflows)
     */
    // TODO: handle not found
    return appsDBService.db.get(appId)
      .then((response) => {
        const cleanApp = Promise.resolve(cleanForOutput(response));
        let appPromise = Promise.resolve(cleanApp);
        if (withFlows) {
          appPromise = appPromise.then((app) => {
            const augmentedApp = app;
            return getFlowsForApp(app.id, withFlows)
              .then((flows) => {
                augmentedApp.flows = flows;
                return augmentedApp;
              });
          });
        }
        return appPromise;
      })
      .catch((err) => {
        if (err.name === 'not_found') {
          return Promise.resolve(null);
        }
        throw err;
      });
  }

  /**
   * Fetch many apps by their id
   *
   * Options:
   *    * ## options
   *    - withFlows {boolean|string} get also all the related flows. Possible values:
   *      - short {string} - get short version of the flows
   *      - full {string} -  get full version of the flows
   *      - true {boolean} - same as 'short'
   *      - false {boolean} - do not get the flows
   * @param appIds {string[]} ids of the apps to fetch
   * @param options
   * @param options.withFlows retrieve flows
   */
  static fetchManyById(appIds = [], { withFlows } = { withFlows: false }) {
    return appsDBService.db
      .allDocs({
        keys: appIds,
        include_docs: true,
      })
      .then(result => (result.rows || [])
        .filter((appRow) => {
          const isError = appRow.error;
          const isDeleted = appRow.value && appRow.value.deleted;
          return !isError && !isDeleted;
        })
        .map(appRow => cleanForOutput(appRow.doc)),
      )
      .then(apps => (withFlows ? augmentWithFlows(apps, withFlows) : apps));
  }

  /**
   * Alias for AppsManager::find
   * @param args
   */
  static list(...args) {
    return AppsManager.find(args);
  }

  static ensureDefaultApp() {
    const db = appsDBService.db;

    db.get('_local/default_installed')
      .then(() => true)
      .catch((err) => {
        if (err.name === 'not_found') {
          const app = build(DEFAULT_APP);
          return db.put(app)
            .then(() => db.put('_local/default_installed'));
        }
        throw err;
      });
  }

}
export default AppsManager;

function getAppNameForSearch(rawName) {
  return rawName ? rawName.trim().toLowerCase() : undefined;
}

function validate(app) {
  const errors = [];
  let promise = Promise.resolve(true);

  const appName = getAppNameForSearch(app.name);
  if (!appName) {
    errors.push({
      property: 'name',
      title: 'Name cannot be empty',
      value: app.name,
      type: CONSTRAINTS.REQUIRED,
    });
  }

  if (appName) {
    promise = appsDBService
      .db.query(`views/${VIEWS.name}`, { key: appName.trim().toLowerCase() })
      .then((result) => {
        const rows = result.rows ? result.rows.filter(row => row.id !== app._id) : [];
        if (rows.length) {
          errors.push({
            property: 'name',
            title: 'Name already exists',
            detail: 'There\'s another app with that name',
            value: app.name,
            type: CONSTRAINTS.UNIQUE,
          });
        }
      });
  }

  return promise.then(() => {
    if (errors.length) {
      throw ErrorManager.createValidationError(errors[0].message || 'Validation errors', errors);
    } else {
      return true;
    }
  });
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
    { normalizedName: kebabCase(app.name).trim() },
    app,
    { createdAt: now, updatedAt: null, version: null },
  );
}

function cleanForOutput(app) {
  const cleanedApp = Object.assign({ id: app._id }, app);
  return pick(cleanedApp, PUBLISH_FIELDS);
}

function getFlowsForApp(appId, type) {
  return FlowsManager.find({ appId }, { fields: type });
}

function augmentWithFlows(apps, flowFields) {
  return Promise.all(apps.map(app => getFlowsForApp(app.id, flowFields)
    .then((flows) => {
      const augmentedApp = app;
      augmentedApp.flows = flows;
      return augmentedApp;
    })));
}
