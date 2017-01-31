import pick from 'lodash/pick';
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';

import { flowsDBService } from '../../config/app-config';
import { VIEWS } from '../../common/db/flows';

import { AppsManager } from '../apps';

import { PUBLISH_FIELDS_LONG, PUBLISH_FIELDS_SHORT } from './constants';
import { convertToCliSchema } from './export';

/*

 */

export class FlowsManager {

  static create(flow) {
    // TODO
  }

  /**
   *
   * @param app
   * @param appId if not provided will try to use app.id
   */
  static update(flow, flowId = null) {
    // TODO
  }

  static save(flow, flowId = null) {
    // TODO
  }

  static remove(flowId) {
    // TODO
  }

  /**
   * Remove all flows with the specified id
   * @param appId {string} app id
   * @return Promise<int> number of flows deleted
   */
  static removeByAppId(appId) {
    return flowsDBService.db
      .query(`views/${VIEWS.appId}`, { key: appId, include_docs: true })
      .then((result) => {
        if (!result.total_rows) {
          return 0;
        }
        const flows = result.rows.map(row => Object.assign({ _deleted: true }, row.doc));
        return flowsDBService.db.bulkDocs(flows)
          .then(deleteResult => deleteResult.filter(row => row.ok).length);
      });
  }

  /**
   * List or find all apps
   *
   * ## searchTerms
   * - appId {string} find by app id with exactly this appId
   * - name {string} find by name with exactly this name (case insensitive). If used along with appId will apply appId
   *    before name. Causing the name lookup to be inside the specified appId context.
   *
   * ## options
   * - fields {boolean|string} Possible values:
   *    - short {string} - get short version of the flows
   *    - full {string} -  get full version of the flows
   *    - raw {string} (deprecated) -  get raw version from db
   *    - true {boolean} - same as 'short'
   *    - false {boolean} - do not get the flows
   *
   * @param terms
   * @params terms.name {string} name of flow
   * @params terms.appId {string} id of the app
   * @params options
   * @params options.fields {string} which fields to retrieve, defaults to 'short' version
   * @params options.withApps {boolean} fetch related app. Default false.
   */
  static find(terms = {}, options) {
    const { fields, withApps } = Object.assign({ fields: 'short', withApps: false }, options);

    const queryOpts = { include_docs: true };
    // todo: include name
    if (terms.appId) {
      queryOpts.key = terms.appId;
    }
    return flowsDBService.db
      .query(`views/${VIEWS.appId}`, queryOpts)
      .then(result => (result.rows || [])
        .map(flowRow => cleanForOutput(flowRow.doc, fields))
      )
      .then(flows => (withApps ? augmentWithApps(flows) : flows));
  }

  /**
   * List or find last updated flows

   * ## options
   * - fields {boolean|string} Possible values:
   *    - short {string} - get short version of the flows
   *    - full {string} -  get full version of the flows
   *    - raw {string} (deprecated) -  get raw version from db
   *    - true {boolean} - same as 'short'
   *    - false {boolean} - do not get the flows
   *
   * @params options
   * @params options.fields {string} which fields to retrieve, defaults to 'short' version
   * @params options.withApps {boolean} fetch related app. Default false.
   */
  static findRecent(options) {
    const {
      limit, fields, withApps,
    } = Object.assign({}, { limit: 10, fields: 'short', withApps: true }, options);

    return flowsDBService.db
      .query(`views/${VIEWS.updatedAt}`, {
        limit,
        descending: true,
        include_docs: true,
      })
      .then(result => (result.rows || [])
        .map(flowRow => cleanForOutput(flowRow.doc, fields)),
      )
      .then(flows => (withApps ? augmentWithApps(flows) : flows));
  }

  /**
   * Find flow with the specified id
   *
   * Options:
   *    * ## options
   *    - fields {boolean|string} Possible values:
   *      - short {string} - get short version of the flow
   *      - full {string} -  get full version of the flow
   *      - raw {string} (deprecated) -  get raw version of flow
   *    - withApp {boolean} get also the related app.
   * @params flowId {string} flow id
   * @params options
   * @params options.fields {string} which fields to retrieve, defaults to 'full' version
   * @params options.withApp {boolean} fetch related app. Default false.
   */
  static findOne(flowId, options) {
    const { fields, withApp } = Object.assign({ fields: 'full', withApp: false }, options);
    // TODO: handle not found
    return flowsDBService.db.get(flowId)
      .then((flow) => {
        return Promise.resolve(cleanForOutput(flow, fields))
          .then(cleanFlow => withApp ? augmentWithApp(cleanFlow, { withFlows: false }) : cleanFlow);
      })
      .catch((err) => {
        if (err.name === 'not_found') {
          return Promise.resolve(null);
        }
        throw err;
      });
  }

  /**
   * Exports many flows to the schema of flogo cli
   * @param options {object} options
   * @param options.appId {string} the appId of the flows to export
   * @return {Promise<{flow:object,trigger:object}>}
   */
  static convertManyToCliSchema(options = {}) {
    if (options.appId) {
      return FlowsManager.find({ appId: options.appId }, { fields: 'raw' })
        .then(flows => flows.map(flow => convertToCliSchema(flow)));
    }
    return Promise.resolve([]);
  }

  /**
   * Alias for AppsManager::find
   * @param args
   */
  static list(...args) {
    return FlowsManager.find(args);
  }

}
export default FlowsManager;


function cleanForOutput(flow, fields) {
  let cleanFlow = Object.assign({
    id: flow.id || flow._id,
    updatedAt: flow.updatedAt || flow.updated_at,
    createdAt: flow.createdAt || flow.created_at,
  }, flow);

  if (fields === 'raw') {
    return flow;
  }

  if (fields === 'short') {
    cleanFlow = pick(cleanFlow, PUBLISH_FIELDS_SHORT);
  } else if (fields === 'full') {
    cleanFlow = pick(cleanFlow, PUBLISH_FIELDS_LONG);
  }
  return cleanFlow;
}


function augmentWithApps(flows = []) {
  const appIds = uniq(flows.map(flow => flow.appId));
  return AppsManager.fetchManyById(appIds, { withFlows: false })
    .then(allApps => keyBy(allApps, 'id'))
    .then(appsMap => flows.map(flow => Object.assign({ app: appsMap[flow.appId] || null }, flow)));
}

function augmentWithApp(flow, options) {
  const augmentedFlow = flow;
  return AppsManager.findOne(flow.appId, options )
    .then((app)=> {
      augmentedFlow.app = app;
      return augmentedFlow;
    });
}
