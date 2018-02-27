import * as _ from 'lodash';
import { FLOGO_TASK_TYPE, ValueTypes } from '@flogo/core/constants';
import {flogoGenTriggerID, flogoIDEncode, isSubflowTask} from '@flogo/shared/utils';
import { ErrorService } from '@flogo/core/services/error.service';

import {
  FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE,
  FLOGO_FLOW_DIAGRAM_NODE_TYPE
} from '../../shared/diagram/constants';

import { FlogoFlowDiagramNode } from '../../shared/diagram/models/node.model';
import {ActionBase} from '@flogo/core';

const FLOW_NODE = 'node';
const FLOW_ITEM = 'item';

export abstract class AbstractModelConverter {
  subflowSchemaRegistry: Map<string, ActionBase>;
  errorService: ErrorService;

  constructor(errorService: ErrorService) {
    this.errorService = errorService;
  }

  abstract getActivitiesPromise(list);

  abstract getTriggerPromise(trigger);

  abstract getFlowInformation(flow);

  convertToWebFlowModel(flowObj, subflowSchema: Map<string, ActionBase>) {
    this.subflowSchemaRegistry = subflowSchema;
    return this.getActivitiesPromise(this.getActivities(flowObj))
      .then((installedActivities) => {
        const installedTiles = _.flattenDeep(installedActivities);
        return this.processFlowObj(flowObj, installedTiles);
      });
  }

  getActivities(flow: any) {
    const activitiesList = [];
    let tasks = _.get(flow, 'data.flow.rootTask.tasks', []);
    // add tiles from error diagram
    tasks = tasks.concat(_.get(flow, 'data.flow.errorHandlerTask.tasks', []));
    // filter only tasks of type activity and ignore subflows
    tasks = tasks.filter(t => !isSubflowTask(t.type));

    tasks.forEach((task) => {
      const ref = task.activityRef;
      if (!ref) {
        throw this.errorService.makeOperationalError('Activity: Wrong input json file',
          `Cannot get activityRef for task: ${task.name}`,
          {
            type: 'ValidationError',
            title: 'Wrong input json file',
            detail: 'Cannot get activityRef for task:',
            property: 'task',
            value: task
          });
      }
      if (activitiesList.indexOf(ref) === -1) {
        activitiesList.push(ref);
      }
    });

    return activitiesList;
  }

  processFlowObj(flowJSON, installedContribs) {
    // task flows
    let tasks = _.get(flowJSON, 'data.flow.rootTask.tasks', []);
    const defaultErrorRootId = tasks.length + 2;
    // links tasks
    let links = _.get(flowJSON, 'data.flow.rootTask.links', []);

    const flowInfo = this.getFlowInformation(flowJSON);

    const mainFlowParts = this.getFlowParts(installedContribs, tasks, links);
    const currentFlow = this.makeFlow(mainFlowParts, flowInfo, installedContribs);

    const flowData = flowJSON.data.flow;
    if (flowData && flowData.errorHandlerTask) {
      // task flows of error handler
      tasks = _.get(flowData, 'errorHandlerTask.tasks', []);
      // links tasks of error handler
      links = _.get(flowData, 'errorHandlerTask.links', []);
      // error task's root id value
      const errorId = _.get(flowData, 'errorHandlerTask.id', defaultErrorRootId);
      const errorFlowParts = this.getFlowParts(installedContribs, tasks, links, errorId);

      currentFlow.errorHandler = this.makeFlow(errorFlowParts, flowInfo);
    }
    return currentFlow;
  }


  makeFlow(parts, flowInfo, installedTiles?) {
    let flow: any = {};
    try {
      const { nodes, items, branches } = parts;
      const { id, name, description, appId, app, metadata } = flowInfo;

      const nodeTrigger = nodes.find((element) => {
        const nodeType = element.node.type;
        return nodeType === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW;
      });

      flow = {
        id,
        name,
        description,
        appId,
        app,
        paths: {
          nodes: {},
        },
        items: {},

        // todo: remove _id, keeping it for now for legacy code that should move to id
        _id: id,
      };

      if (metadata) {
        flow.metadata = metadata;
      }

      if (nodeTrigger) {
        flow.paths.root = {};
        flow.paths.root.is = nodeTrigger.node.id;
      } else {
        const orphanNode = nodes.find(result => result.node && result.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE &&
          result.node.parents.length === 0);
        if (orphanNode) {
          flow.paths.root = {};
          flow.paths.root.is = orphanNode.node.id;
        }
      }

      if (installedTiles) {
        flow.schemas = {};
      }

      nodes.concat(branches).forEach((element) => {
        flow.paths.nodes[element.node.id] = element.node;
      });

      items.forEach((element) => {
        element.node.name = _.get(element, 'cli.name', element.node.name);
        element.node.description = _.get(element, 'cli.description', element.node.description);
        flow.items[element.node.id || element.node.nodeId] = element.node;
        if (installedTiles && element.cli && !isSubflowTask(element.cli.type)) {
          flow.schemas[element.node.ref] = installedTiles.find((tile) => {
            return tile.ref === element.node.ref;
          });
        }
      });
    } catch (error) {
      console.error('Error function makeFlow:', error);
      throw error;
    }
    return flow;
  }

  getFlowParts(installedTiles, tasks, links, errorRootID?) {
    const nodes = [];
    const items = [];
    const branches = [];
    const node = new FlowElement(FLOW_NODE);
    const item = new FlowElement(FLOW_ITEM);

    try {
      let nodeTrigger;
      if (errorRootID) {
        const rootTrigger = { isErrorTrigger: true, taskID: flogoIDEncode(errorRootID), cli: { id: -1 } };
        nodeTrigger = node.makeTrigger(rootTrigger);
        const itemTrigger = item.makeTrigger(rootTrigger);
        nodes.push({ node: nodeTrigger, cli: rootTrigger });
        items.push({ node: itemTrigger, cli: rootTrigger });
      }

      tasks.forEach((task) => {
        const nodeItem = node.makeItem({ taskID: flogoIDEncode(task.id) });

        let installedActivity = installedTiles.find(tile => tile.ref === task.activityRef);
        if (isSubflowTask(task.type)) {
          installedActivity = {ref: 'subflow'};

          if (task.inputMappings) {
            // If the flow is still available get the inputs of a subflow from its latest definition
            // else consider an empty array as flow inputs.
            const subflowInputs = (this.subflowSchemaRegistry.get(task.flowRef)
              && this.subflowSchemaRegistry.get(task.flowRef).metadata.input) || [];
            // Remove the dangling inputMappings of old flow inputs. This won't save to the database yet
            // but it will make sure it won't maintain the dangling mappings when next time flow is saved.
            task.inputMappings = task.inputMappings.filter(mapping => !!subflowInputs.find(i => i.name === mapping.mapTo));
          }
        }
        if (!installedActivity) {
          throw this.errorService.makeOperationalError('Activity is not installed', `Activity: ${task.activityRef}`,
            {
              type: 'notInstalledActivity',
              title: 'Activity is not installed',
              detail: `Activity: ${task.activityRef}`,
              property: 'task',
              value: task
            });
        }
        const itemActivity = item.makeItem({ node: nodeItem, cli: task, installed: installedActivity });

        nodes.push({ node: nodeItem, cli: task });
        items.push({ node: itemActivity, cli: task });
      });

      // add branches
      links.forEach((link) => {
        if (link.type === FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH) {
          const branchNode = node.makeBranch();
          const branchItem = item.makeBranch({ taskID: branchNode.taskID, condition: link.value });
          // get connectors points
          const nodeFrom = nodes.find(result => result.cli.id === link.from);
          const nodeTo = nodes.find(result => result.cli.id === link.to);

          branches.push({ node: branchNode, connector: { from: nodeFrom.cli.id, to: nodeTo.cli.id } });
          items.push({ node: branchItem, cli: null, connector: null });
        }
      });


      const nodeLinks = links.filter(link => link.type !== FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH);
      const branchesLinks = links.filter(link => link.type === FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH);
      linkTiles(nodes, nodeLinks, nodeTrigger);

      linkBranches(branches, nodes, branchesLinks);
    } catch (error) {
      console.error('Function getFlowParts:', error);
      throw error;
    }

    return { nodes, items, branches };

    function linkTiles(inputNodes, inputLinks, errorNodeTrigger) {
      try {
        inputLinks.forEach((link) => {
          const from = inputNodes.find(result => result.cli.id === link.from);
          const to = inputNodes.find(result => result.cli.id === link.to);
          linkNodes(from.node, to.node);
        });

        if (errorNodeTrigger) {
          // set link between trigger and first node
          const orphanNode = inputNodes.find(result => result.node && result.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE &&
            result.node.parents.length === 0);

          if (orphanNode) {
            linkNodes(errorNodeTrigger, orphanNode.node);
          } else if (inputLinks.length) {
            throw new Error('Function linkTiles:Cannot link trigger with first node');
          }
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }

    function linkBranches(inputBranches, inputNodes, inputLinks) {
      try {
        inputLinks.forEach((link) => {
          const branch = inputBranches.find(thisBranch => thisBranch.connector.from === link.from && thisBranch.connector.to === link.to);
          const nodeFrom = inputNodes.find(thisNode => thisNode.cli.id === link.from);
          const nodeTo = inputNodes.find(thisNode => thisNode.cli.id === link.to);

          if (branch && nodeFrom && nodeTo) {
            linkNodes(nodeFrom.node, branch.node);
            linkNodes(branch.node, nodeTo.node);
          } else {
            throw new Error('Unable to link branches');
          }
        });
      } catch (error) {
        console.error('Error function linkBranches:', error);
        throw error;
      }
    }

    function linkNodes(parent, child) {
      try {
        parent.children.push(child.id);
        child.parents.push(parent.id);
      } catch (error) {
        console.error('Function linkNodes:', error);
        throw error;
      }
    }
  }

  makeTriggerTask(trigger, installedTrigger) {
    const nodeElement = new FlowElement(FLOW_NODE);
    const itemElement = new FlowElement(FLOW_ITEM);
    const nodeTrigger = nodeElement.makeTrigger(trigger);
    const itemTrigger = itemElement.makeTrigger({
      node: nodeTrigger,
      cli: trigger,
      installed: installedTrigger,
      endpointSetting: trigger.handler
    });
    itemTrigger.name = trigger.name;
    itemTrigger.description = trigger.description;
    itemTrigger.outputs.forEach(o => {
      if (trigger.handler.outputs[o.name]) {
        o.value = trigger.handler.outputs[o.name];
      }
    });

    return itemTrigger;
  }
}

class FlowElement {
  factory: any;

  constructor(factoryName) {
    switch (factoryName) {
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

  makeBranch(branch?) {
    return this.factory.makeBranch(branch);
  }

}

class NodeFactory {
  static makeTrigger(trigger) {
    if (trigger.isErrorTrigger) {
      return Object.assign({}, this.getSharedProperties(), {
        type: FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW, taskID: trigger.taskID
      });
    } else {
      return Object.assign({}, this.getSharedProperties(), {
        type: FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT, taskID: flogoGenTriggerID()
      });
    }
  }

  static makeItem(item) {
    return Object.assign({}, this.getSharedProperties(), {
      type: FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE, taskID: item.taskID
    });
  }

  static getSharedProperties() {
    const status = { isSelected: false };
    return Object.assign({}, { id: FlogoFlowDiagramNode.genNodeID(), __status: status, children: [], parents: [] });
  }

  static makeBranch() {
    return Object.assign({}, this.getSharedProperties(), {
      type: FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH, taskID: NodeFactory.flogoGenBranchID()
    });
  }

  static flogoGenBranchID() {
    const id = `Flogo::Branch::${Date.now()}::${FlogoFlowDiagramNode.count++}`;
    return flogoIDEncode(id);
  }
}

class ItemFactory {

  static getSharedProperties(installed) {
    const defaults = {
      name: '',
      version: '',
      homepage: '',
      description: '',
      installed: true,
      settings: {},
      outputs: [],
      ref: '',
      endpoint: { settings: [] },
      __props: {
        errors: [],
      },
      __status: {}
    };
    return Object.assign({}, defaults, _.pick(installed, ['name', 'version', 'homepage', 'description', 'ref']));
  }

  static makeTriggerError(trigger) {
    return {
      id: trigger.taskID,
      type: FLOGO_TASK_TYPE.TASK_ROOT,
      version: '',
      name: 'On Error',
      description: '',
      activityType: '',
      triggerType: '__error-trigger',
      attributes: {
        outputs: [{
          name: 'activity', type: ValueTypes.STRING, title: 'activity', value: '',
        }, {
          name: 'message', type: ValueTypes.STRING, title: 'message', value: '',
        }, {
          name: 'data', type: ValueTypes.ANY, title: 'data', value: '',
        }],
      },
      inputMappings: [],
      outputMappings: [],
      outputs: [{
        name: 'activity', type: ValueTypes.STRING, title: 'activity', value: '',
      }, {
        name: 'message', type: ValueTypes.STRING, title: 'message', value: '',
      }, {
        name: 'data', type: ValueTypes.ANY, title: 'data', value: '',
      }],
      __props: {
        errors: [],
      },
      __status: {},
    };
  }

  static makeTrigger(trigger): any {
    if (trigger.isErrorTrigger) {
      return this.makeTriggerError(trigger);
    }

    const { installed, cli, endpointSetting } = trigger;
    const item = Object.assign({}, this.getSharedProperties(installed), { id: trigger.node.taskID }, {
      nodeId: trigger.node.taskID, type: FLOGO_TASK_TYPE.TASK_ROOT, triggerType: installed.name, settings: [],
    });

    const settings = _.get(cli, 'settings', {});
    // get settings
    const rawTriggerSchemaSettings = _.isArray(installed.settings) ? installed.settings : [];
    const triggerSchemaSettings = new Map(rawTriggerSchemaSettings.map(s => [s.name, s]));
    Object.keys(settings).forEach((property) => {
      // TODO: if no schema?
      const schema: any = triggerSchemaSettings.get(property);
      const newSetting: any = {
        name: property, type: schema.type, value: settings[property],
      };
      if (schema.required) {
        newSetting.required = true;
      }
      item.settings.push(newSetting);
    });

    const endpointSettings = _.get(installed, 'endpoint.settings', []);
    const installedEndpointSettings = new Map(endpointSettings.map<[string, any]>(s => [s.name, s]));
    Object.keys(endpointSetting.settings || {}).forEach((property) => {
      const schema: any = installedEndpointSettings.get(property);

      // TODO: if no schema?
      const newEndpointSetting: any = {
        name: property, type: schema.type, value: endpointSetting.settings[property],
      };
      if (schema.required) {
        newEndpointSetting.required = true;
      }

      if (schema.allowed) {
        newEndpointSetting.allowed = schema.allowed;
      }
      item.endpoint.settings.push(newEndpointSetting);
    });

    const mapType = prop => ({
      name: prop.name,
      type: prop.type || ValueTypes.STRING,
    });
    // -----------------
    // set outputs
    const outputs = installed.outputs || [];
    item.outputs = outputs.map(mapType);

    const reply = installed.reply || [];
    item['reply'] = reply.map(mapType);

    return item;
  }

  static makeItem(activitySource): any {
    const { node, installed: activitySchema, cli: taskInstance } = activitySource;

    const item = <any> Object.assign({}, this.getSharedProperties(activitySchema), {
      attributes: {
        inputs: [], outputs: []
      },
      inputMappings: taskInstance.inputMappings || [],
      id: node.taskID,
      type: FLOGO_TASK_TYPE[taskInstance.type] ? FLOGO_TASK_TYPE[FLOGO_TASK_TYPE[taskInstance.type]] : FLOGO_TASK_TYPE.TASK,
      activityType: activitySchema.id,
      settings: taskInstance.settings || {}
    });

    if (activitySchema.return) {
      item.return = true;
    }

    // Add flowRef for the case of a subflow type of task
    if (isSubflowTask(taskInstance.type)) {
      item.flowRef = taskInstance.flowRef;
    }

    // -------- set attributes inputs  ----------------
    const schemaInputs = activitySchema.inputs || [];
    const taskInstanceAttributes = taskInstance.attributes || [];

    schemaInputs.forEach((schemaInput) => {
      const attrValue = taskInstanceAttributes.find(attribute => attribute.name === schemaInput.name);

      const newAttribute: any = {
        name: schemaInput.name,
        type: schemaInput.type || ValueTypes.STRING,
      };

      if (attrValue) {
        newAttribute.value = attrValue.value;
        newAttribute.required = attrValue.required || false;
      } else {
        // use the value provided by the schema
        newAttribute.value = schemaInput.value;
      }

      item.attributes.inputs.push(newAttribute);
    });

    // -----------------
    // set attributes outputs
    const outputs = activitySchema.outputs || [];

    item.attributes.outputs = outputs.map(output => ({
      name: output.name,
      type: output.type || ValueTypes.STRING,
    }));


    return item;
  }

  static makeBranch(branch) {
    return {
      id: branch.taskID, type: FLOGO_TASK_TYPE.TASK_BRANCH, condition: branch.condition,
    };
  }
}
