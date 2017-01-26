import { ErrorManager, ERROR_TYPES } from '../../common/errors';
import pick from 'lodash/pick';
import get from 'lodash/get';
import flattenDeep from 'lodash/flattenDeep';

import { FlowsManager } from './../../modules/flows/';
import { TriggerManager } from './../../modules/triggers/';
import { ActivitiesManager } from './../../modules/activities/';
import { genNodeID, flogoGenTriggerID, flogoGenTaskID, flogoIDEncode } from './../../common/utils';
import {FLOGO_FLOW_DIAGRAM_NODE_TYPE, FLOGO_TASK_TYPE, FLOGO_TASK_ATTRIBUTE_TYPE,FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE} from '../../common/constants';
const FLOW_NODE   = 'node';
const FLOW_ITEM   = 'item';
// TODO user FlowsManager
import { createFlow } from './../../api/flows';

// TODO document
export function importFlows(importedFlows) {
  let importApp = new ImportFlows(importedFlows);
  return importApp.import();
}

// TODO document
class ImportFlows {
  constructor(importedFlows) {
    this.sourceFlows = importedFlows;
    this.targetFlow = {}
  }

  import() {
    this.targetFlow.nodes = {};
    let itemIndex = 2;

    return Promise.all([getTriggers(this.sourceFlows), getActivities(this.sourceFlows)])
      .then((triggersAndActivities) => {
        let installedTiles = flattenDeep(triggersAndActivities);
        return makeFlows(this.sourceFlows, installedTiles)
          .then((flows)=> {
            let promises = [];
            flows.forEach((flow)=> promises.push(createFlow(flow)) );
            return Promise.all(promises)
              .then(()=> {
                return {
                  createdApp:this.sourceFlows.createdApp
                }
              })
          });
      });


    function makeFlows(flows, installedTiles) {

      return new Promise((resolve, reject) => {
          let actions = flows.actions || [];
          let resultFlows = [];

          flows.triggers.forEach((trigger)=> {

            let endpoints = get(trigger, 'handlers', []);
            // make the flows for this trigger
            endpoints.forEach((endpoint)=> {

              // get the flow
              let flowActions = actions.find((action)=>  action.id === endpoint.actionId );
              // task flows
              let tasks = get(flowActions, 'data.flow.rootTask.tasks',[]);
              // links tasks
              let links = get(flowActions, 'data.flow.rootTask.links',[]);

              let flowInfo = {
                appId: flows.createdApp.id,
                name: flowActions.name || flowActions.id,
                description: flowActions.description || ''
              };

              let mainFlowParts = getFlowParts(trigger, tasks, links,  installedTiles, endpoint);
              let currentFlow = makeFlow(mainFlowParts , flowInfo);


              // task flows of error handler
              tasks = get(flowActions, 'data.flow.errorHandlerTask.tasks',[]);
              // links tasks of error hander
              links = get(flowActions, 'data.flow.errorHandlerTask.links',[]);
              let errorFlowParts = getFlowParts(null, tasks, links, installedTiles, endpoint );

              currentFlow.errorHandler = makeFlow(errorFlowParts, flowInfo);

              resultFlows.push(currentFlow);

            }); //iterate over endpoints

          }); //iterate over triggers

          resolve(resultFlows);
      });
    }

    function makeFlow(parths, flowInfo) {
      let flow = {};
      try {

        let {nodes, items, branches} = parths;
        let {name, description, appId} = flowInfo;

        let nodeTrigger = nodes.find((element)=> {
          let nodeType = element.node.type;
          return nodeType === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT  || nodeType === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW;
        });

        flow = {
          name, description , appId,
          paths: {
            root: {
              is: nodeTrigger.node.id
            },
            nodes: {}
          },
          items: {}
        };

        nodes.concat(branches).forEach((element)=> {
          flow.paths.nodes[element.node.id] = element.node;
        });

        items.forEach((element)=> {
          flow.items[element.node.id || element.node.nodeId] = element.node;
        });

    }catch(error) {
        console.error('Error function makeFlow:',error);
        throw error;
    }

    return flow;
    }

    function getFlowParts(trigger,  tasks, links,  installedTiles, endpointSetting) {
      let nodes = [], items = [], branches = [];
      let node   = new FlowElement(FLOW_NODE);
      let item   = new FlowElement(FLOW_ITEM);

      try {
        let rootTrigger = trigger ? trigger : {isErrorTrigger: true, taskID: flogoIDEncode(''+ itemIndex), cli: {id:-1} };
        let nodeTrigger = node.makeTrigger(rootTrigger);

        let installedTrigger = installedTiles.find((tile)=> trigger && tile.where === trigger.ref );
        if(trigger && !installedTrigger) {
          throw ErrorManager.makeError('Trigger is not installed',
            { type: ERROR_TYPES.COMMON.VALIDATION,
              details:{
                errors: [
                  {
                    title: 'Trigger is not installed',
                    detail: `Trigger: ${trigger.ref}`,
                    property: 'trigger',
                    value: trigger
                  }
                ]
              }});
        }

        let itemTrigger = item.makeTrigger(trigger ? { node:nodeTrigger,cli:rootTrigger, installed:installedTrigger, endpointSetting} : rootTrigger);
        nodes.push({ node:nodeTrigger,    cli:rootTrigger });
        items.push({ node:itemTrigger,    cli:rootTrigger });

        tasks.forEach((task)=> {
          let nodeItem = node.makeItem( { taskID : flogoIDEncode(''+ itemIndex) });
          itemIndex += 1;

          let installedActivity = installedTiles.find((tile)=> {
            return tile.where === task.activityRef;
          });
          if(!installedActivity) {
            throw ErrorManager.makeError('Activity is not installed',
              { type: ERROR_TYPES.COMMON.VALIDATION,
                details:{
                  errors: [
                    {
                      title: 'Activity is not installed',
                      detail: `Activity: ${task.activityRef}`,
                      property: 'task',
                      value: task
                    }
                  ]
                }});
          }
          let itemActivity = item.makeItem({ node:nodeItem,cli:task, installed:installedActivity});

          nodes.push({ node:nodeItem, cli:task });
          items.push({ node:itemActivity, cli:task });
        });

        // add branches
        links.forEach((link)=> {
                                 if(link.type === FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH) {
                                 let branchNode = node.makeBranch();
                                 let branchItem = item.makeBranch({taskID: branchNode.taskID, condition: link.value});
                                 // get connectors points
                                 let nodeFrom = nodes.find((result)=> result.cli.id === link.from );
                                 let nodeTo   = nodes.find((result)=> result.cli.id === link.to );

                                 branches.push({node:branchNode, connector:{from:nodeFrom.cli.id, to: nodeTo.cli.id} });
                                 items.push({ node:branchItem, cli:null, connector:null });
                                 }
                                 });

        let nodeLinks    = links.filter((link)=>link.type !== FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH);
        let branchesLinks = links.filter((link)=>link.type === FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH);
        linkTiles(nodes, nodeLinks,  nodeTrigger );

        linkBranches(branches, nodes,  branchesLinks);

      }catch(error) {
        console.error('Function getFlowParts:',error);
        throw error;
      }

      return {nodes, items, branches};

      function linkTiles(nodes, links, nodeTrigger ) {

        try {
          links.forEach((link)=> {
            let from = nodes.find((result)=> result.cli.id === link.from);
            let to =   nodes.find((result)=> result.cli.id === link.to);
            linkNodes(from.node, to.node);
          });

          // set link between trigger and first node
          let orphanNode = nodes.find((result)=> {
            let node = result.node;
            return node.parents.length === 0 && node.children.length > 0;
          });

          if(orphanNode) {
            linkNodes(nodeTrigger, orphanNode.node);
          }else {
            if(links.length) {
              throw new Error('Function linkTiles:Cannot link trigger with first node');
            }
          }
        }catch(error) {
          console.error(error);
          throw error;
        }
      }

      function linkBranches(branches, nodes,  links) {
        try {
          links.forEach((link)=> {
            let branch = branches.find((branch)=>  branch.connector.from === link.from && branch.connector.to === link.to );
            let nodeFrom =  nodes.find((node)=>  node.cli.id === link.from);
            let nodeTo =    nodes.find((node)=>  node.cli.id === link.to);

            if(branch && nodeFrom && nodeTo) {
              linkNodes(nodeFrom.node, branch.node);
              linkNodes(branch.node, nodeTo.node);
            } else {
              throw new Error('Unable to link branches');
            }
          });
        }catch(error) {
          console.error('Error function linkBranches:',error);
          throw error;
        }
      }

      function linkNodes(parent, child) {
        try {
          parent.children.push(child.id);
          child.parents.push(parent.id);
        }catch(error) {
          console.error('Function linkNodes:', error);
          throw error;
        }
      }
    }


    function getTriggers(flows) {
      let promises = [];
      let triggers = flows.triggers || [];

      let triggersURL = triggers.map((trigger)=> {

        if(!trigger.ref) {
          throw ErrorManager.makeError('Wrong input json file',
            { type: ERROR_TYPES.COMMON.VALIDATION,
              details:{
                errors: [
                  {
                    title: 'Wrong input json file',
                    detail: 'Cannot get ref for trigger:',
                    property: 'trigger',
                    value: trigger
                  }
                ]
              }});
        }

        return trigger.ref;
      });
      triggersURL.forEach((url)=> promises.push(TriggerManager.find({whereURL: url})) );

      return Promise.all(promises);
    }


    function getActivities(flows) {
      let promises = [];
      let activities = flows.actions || [];
      let processed = [];

      activities.forEach((activity)=> {
        let tasks = get(activity, 'data.flow.rootTask.tasks', []);
        // add tiles from error diagram
        tasks = tasks.concat(get(activity, 'data.flow.errorHandlerTask.tasks', []));

        tasks.forEach((task)=> {
          let ref = task.activityRef;
          if(!ref) {
            throw ErrorManager.makeError('Wrong input json file',
              { type: ERROR_TYPES.COMMON.VALIDATION,
                details:{
                  errors: [
                    {
                      title: 'Wrong input json file',
                      detail: 'Cannot get activityRef for task:',
                      property: 'task',
                      value: task
                    },
                  ]
                }
              });
          }

          if(processed.indexOf(ref) == -1) {
            processed.push(ref);
            promises.push(ActivitiesManager.find({whereURL: ref}));
          }
        });
      });

      return Promise.all(promises);
    }

  }

}

class FlowElement {
  constructor(factoryName) {
    switch(factoryName) {
      case FLOW_NODE:
        this.factory = NodeFactory;
        break;

      case FLOW_ITEM:
        this.factory = ItemFactory;
        break;

      default:
        throw new Error('Wrong factory Name in class FlowElement');
    }
  }

  makeTrigger(trigger) {
    return this.factory.makeTrigger(trigger);
  }

  makeItem(item) {
    return this.factory.makeItem(item);
  }

  makeBranch(branch) {
    return this.factory.makeBranch(branch);
  }

}

class NodeFactory {
  static makeTrigger(trigger) {
    if(trigger.isErrorTrigger) {
      return Object.assign({}, this.getSharedProperties(), { type  : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW, taskID : trigger.taskID  });
    }else {
      return Object.assign({}, this.getSharedProperties(), { type  : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT, taskID :  flogoGenTriggerID() });
    }
  }
  static makeItem(item) {
    return Object.assign({}, this.getSharedProperties(), { type  : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE, taskID: item.taskID });
  }

  static getSharedProperties() {
    let status = { isSelected: false };
    return Object.assign({}, {id: genNodeID(), __status: status, children: [], parents: []} )
  }
  static makeBranch() {
    return Object.assign({}, this.getSharedProperties(), { type  : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH, taskID :  flogoGenTriggerID() });
  }
}

class ItemFactory {

  static getSharedProperties(installed) {
    let defaults = {name: '', title: '', version:'', homepage:'', description:'', installed : true, settings:[], outputs:[], endpoint:{settings:[]}};
    let item = Object.assign({}, defaults, pick(installed,['name','title','version','homepage','description']), {__schema:installed});
    return item;
  }

  static makeTriggerError(trigger) {
    return  {
        id: trigger.taskID,
        type: FLOGO_TASK_TYPE.TASK_ROOT,
        version: "",
        name: "On Error",
        description: "",
        title: "On Error",
        activityType: "",
        triggerType: "__error-trigger",
        attributes: {
        outputs: [
          {
            name: "activity",
            type: FLOGO_TASK_ATTRIBUTE_TYPE.STRING,
            title: "activity",
            value: ""
          },
          {
            name: "message",
            type: FLOGO_TASK_ATTRIBUTE_TYPE.STRING,
            title: "message",
            value: ""
          },
          {
            name: "data",
            type: FLOGO_TASK_ATTRIBUTE_TYPE.ANY,
            title: "data",
            value: ""
          }
        ]
      },
      inputMappings: [],
        outputMappings: [],
        outputs: [
        {
          name: "activity",
          type: FLOGO_TASK_ATTRIBUTE_TYPE.STRING,
          title: "activity",
          value: ""
        },
        {
          name: "message",
          type: FLOGO_TASK_ATTRIBUTE_TYPE.STRING,
          title: "message",
          value: ""
        },
        {
          name: "data",
          type: FLOGO_TASK_ATTRIBUTE_TYPE.ANY,
          title: "data",
          value: ""
        }
      ],
        __props: {
        errors: []
      },
      __status: {}
    }
  }

  static makeTrigger(trigger) {
    if(trigger.isErrorTrigger) {
      return this.makeTriggerError(trigger)
    }

    let {  installed, cli, endpointSetting} = trigger;
    let item = Object.assign({}, this.getSharedProperties(installed),
                                {id: trigger.node.taskID},
                                {nodeId: trigger.node.taskID, type : FLOGO_TASK_TYPE.TASK_ROOT, triggerType : installed.name} );

    let settings = get(cli, 'settings', {});
    // get settings
    for(var property in settings) {
      let schema = installed.settings.find((setting)=> {
        return setting.name === property;
      });

      let newSetting = {
        name: property,
        type: schema.type,
        value: settings[property]
      };
      if(schema.required) { newSetting.required = true; }
      item.settings.push(newSetting);
    }

    for(var property in endpointSetting.settings) {
      let installedSettings = get(installed, 'endpoint.settings', []);

      let schema = installedSettings.find((setting)=> {
        return setting.name === property;
      });

      let newEndpointSetting = {
        name: property,
        type: schema.type,
        value: endpointSetting.settings[property]
      };
      if(schema.required && schema.required == true) {
        newEndpointSetting.required = true;
      }

      if(schema.allowed) {
        newEndpointSetting.allowed = schema.allowed;
      }
      item.endpoint.settings.push(newEndpointSetting);
    }

    //-----------------
    // set outputs
    let outputs  = installed.outputs || [];

    item.outputs = outputs.map((output)=> {
      return {
        name: output.name,
        type: FLOGO_TASK_ATTRIBUTE_TYPE[get(output,'type','STRING').toUpperCase()]
      }
    });


    return item;
  }

  static makeItem(activity) {
    let { node, installed, cli} = activity;

    let item = Object.assign({}, this.getSharedProperties(installed),
      {attributes: {inputs: [], outputs: []}},
      {inputMappings: cli.inputMappings || [] },
      {id: node.taskID, type : FLOGO_TASK_TYPE.TASK, activityType : installed.id} );

    //-------- set attributes inputs  ----------------
    let installedInputs = installed.inputs || [];
    let cliAttributes = cli.attributes || [];

    installedInputs.forEach((installedInput)=> {

      let cliValue = cliAttributes.find((attribute) => {
        return attribute.name === installedInput.name;
      });

      let newAttribute = {
        name: installedInput.name,
        type:FLOGO_TASK_ATTRIBUTE_TYPE[get(installedInput,'type','STRING').toUpperCase()]
      };

      if(cliValue) {
        newAttribute.value = cliValue.value;
      }else {
        // use the value provided by the schema
        newAttribute.value = installedInput.value;
      }

      item.attributes.inputs.push(newAttribute);
    });

    //-----------------
    // set attributes outputs
    let outputs  = installed.outputs || [];

    item.attributes.outputs = outputs.map((output)=> {
      return {
        name: output.name,
        type: FLOGO_TASK_ATTRIBUTE_TYPE[get(output,'type','STRING').toUpperCase()]
      }
    });


    return item;
  }

  static makeBranch(branch) {
    return {
      id: branch.taskID,
      type: FLOGO_TASK_TYPE.TASK_BRANCH,
      condition: branch.condition
    };
  }
}


