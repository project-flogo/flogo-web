import {config, dbService} from '../../config/app-config';
import {getInitializedEngine} from '../../modules/engine/registry';
import {flogoFlowToJSON} from '../../common/flow.model';
import {flogoIDDecode} from '../../common/utils';
import {Engine} from '../../modules/engine';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';

let basePath = config.app.basePath;

let _dbService = dbService;

//TODO provide more common
function getFlatObj(arr){
  let obj = {};
  for(let i = 0; i<arr.length; i++){
    let item = arr[i];
    if(!item.name){
      continue;
    }
    obj[item.name] = item.value;
  }

  return obj;
}

function generateTriggerJSON(doc, flowName){
  // for now each flow just can has one trigger
  let trigger = {
    name: '',
    endpoints: null,
    settings: null
  };
  let key = _.findKey(doc.items, function(o){return o&&o.triggerType});
  let triggerItem = doc.items[key];
  // For now, triggers.json just has name, settings, endpoints
  trigger.name = triggerItem.triggerType;
  let settings = triggerItem.settings;
  if(_.isArray(settings)){
    trigger.settings = getFlatObj(settings);
  }else{
    trigger.settings = settings;
  }

  trigger.endpoints = [];

  let keys = _.keys(triggerItem.endpoint);
  let endpoint = {};
  keys.forEach((key)=>{
    if(_.isArray(triggerItem.endpoint[key])){
      endpoint[key] = getFlatObj(triggerItem.endpoint[key]);
    }else{
      endpoint[key] = triggerItem.endpoint[key];
    }
  });

  // TODO this is temp solution
  endpoint.actionType = 'flow';
  endpoint.actionURI = `embedded://${flowName}`;
  endpoint.flowURI = endpoint.actionURI;

  trigger.endpoints.push(endpoint);

  console.log('[info]generateTriggerJSON, trigger: ', trigger);
  return trigger;
}

function generateBuild(id, compileOptions) {
  compileOptions = compileOptions || {};
  console.log('generateBuild');

  let flowID = flogoIDDecode(id);
  console.log('id: ', id);
  console.log('flowID: ', flowID);
  return _dbService.db.get(flowID)
    .then((doc)=> {
      console.log(doc);

      let flowJSON = flogoFlowToJSON(doc, { useRef: false });
      console.log(flowJSON);

      // step1: add flow.json
      let flowName = 'flow';
      let tmpFlowJSONPath = path.join(config.rootPath, 'tmp', `${flowName}.json`);

      // todo: remove sync method
      fse.outputJSONSync(tmpFlowJSONPath, flowJSON.flow);

      let triggerJSON = generateTriggerJSON(doc, flowName);
      let triggersJSON = {
        'triggers': []
      };
      triggersJSON.triggers.push(triggerJSON);
      return getInitializedEngine(config.defaultEngine.path)
        .then(engine => ({
          engine,
          flowJsonPath: tmpFlowJSONPath,
          triggersConfig: triggersJSON
        }));

    })
    .then(data => {
      let engine = data.engine;
      return engine.deleteAllInstalledFlows()
        .then(() => engine.addFlow('file://' + data.flowJsonPath))
        .then(() => {
          return Promise.all([
            // step2: update config.json
            engine.updateConfig(config.buildEngine.config, {type: Engine.TYPE_BUILD, overwrite: true}),
            // step3: update trigger.json
            engine.updateTriggersConfig(data.triggersConfig, {type: Engine.TYPE_BUILD, overwrite: true})
          ])
        })
        .then(() => engine.build({
          optimize: true,
          incorporateConfig: true,
          compile: compileOptions,
          type: Engine.TYPE_BUILD
        }));
    })
    .then(result => {
      return fs.readFileSync(result.path);
    })
    .catch(error => {
      console.error(error);
      throw error;
    });
}

export function flowsDetail(app, router){
  if(!app){
    console.error('[Error][api/flows.detail/index.js]You must pass app');
  }
  router.get(basePath+'/flows/:id/build', getBuild);
}

/**
 * @swagger
 *  /flows/{flowId}/build:
 *    get:
 *      tags:
 *        - Flow
 *      summary: Builds the flow for external usage.
 *      parameters:
 *        - name: flowId
 *          in: path
 *          required: true
 *          type: string
 *          description: Encoded ID required for the Flow Building
 *      responses:
 *        200:
 *          description: Flow built successfully
 */
function* getBuild(next){

  console.log('getBuild');

  let id = this.params.id;

  let compileOptions;
  // TODO: make sure os and arch are valid
  if (this.query.os || this.query.arch) {
    compileOptions = {
      os: this.query.os,
      arch: this.query.arch
    };
  }

  this.body = yield generateBuild(id, compileOptions);

  yield next;
}
