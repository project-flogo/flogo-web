import { get, cloneDeep, flattenDeep, fromPairs, isArray, pick, uniqueId } from 'lodash';
import { FLOGO_TASK_TYPE, ValueType } from '@flogo/core/constants';
import {flogoGenTriggerID, isSubflowTask} from '@flogo/shared/utils';
import { ErrorService } from '@flogo/core/services/error.service';

import {
  FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE,
  FLOGO_FLOW_DIAGRAM_NODE_TYPE
} from '../../shared/diagram/constants';

import { FlogoFlowDiagramNode } from '../../shared/diagram/models/node.model';
import { ActionBase, FLOGO_PROFILE_TYPE, ItemActivityTask, ItemTask, UiFlow } from '@flogo/core';
import {CONTRIB_REF_PLACEHOLDER} from '@flogo/core/constants';
import {RESTAPIContributionsService} from '@flogo/core/services/restapi/v2/contributions.service';

export abstract class AbstractModelConverter {
  subflowSchemaRegistry: Map<string, ActionBase>;
  errorService: ErrorService;
  contribService: RESTAPIContributionsService;

  constructor(contributionService: RESTAPIContributionsService, errorService: ErrorService) {
    this.contribService = contributionService;
    this.errorService = errorService;
  }

  abstract getActivitiesSchema(list);

  abstract getProfileType(): FLOGO_PROFILE_TYPE;

  abstract getFlowInformation(flow);

  getTriggerSchema(trigger) {
    if (!trigger.ref) {
      throw this.errorService.makeOperationalError('Trigger: Wrong input json file', 'Cannot get ref for trigger',
        {
          type: 'ValidationError',
          title: 'Wrong input json file',
          detail: 'Cannot get ref for trigger:',
          property: 'trigger',
          value: trigger
        });
    } else {
      return this.contribService.getContributionDetails(this.getProfileType(), trigger.ref);
    }
  }

  convertToWebFlowModel(flowObj, subflowSchema: Map<string, ActionBase>) {
    this.subflowSchemaRegistry = subflowSchema;
    return this.getActivitiesSchema(this.activitiesUsed(flowObj))
      .then((installedActivities) => {
        const installedTiles = flattenDeep(installedActivities);
        return this.processFlowObj(flowObj, installedTiles);
      });
  }

  activitiesUsed(flow: any) {
    const activitiesList = [];
    let tasks = get(flow, 'data.flow.rootTask.tasks', []);
    // add tiles from error diagram
    tasks = tasks.concat(get(flow, 'data.flow.errorHandlerTask.tasks', []));
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
    let tasks = get(flowJSON, 'data.flow.rootTask.tasks', []);
    // links tasks
    let links = get(flowJSON, 'data.flow.rootTask.links', []);

    const flowInfo = this.getFlowInformation(flowJSON);

    const mainFlowParts = this.getFlowParts(installedContribs, tasks, links);
    const currentFlow = this.makeFlow(mainFlowParts, flowInfo, installedContribs);

    const flowData = flowJSON.data.flow;
    if (flowData && flowData.errorHandlerTask) {
      // task flows of error handler
      tasks = get(flowData, 'errorHandlerTask.tasks', []);
      // links tasks of error handler
      links = get(flowData, 'errorHandlerTask.links', []);
      // error task's root id value
      const errorFlowParts = this.getFlowParts(installedContribs, tasks, links);

      currentFlow.errorHandler = this.makeFlow(errorFlowParts, flowInfo);
    }
    return currentFlow;
  }


  makeFlow(parts, flowInfo, schemas?): UiFlow {
    let flow: any = {};
    try {
      const { nodes, items, branches } = parts;
      const { id, name, description, appId, app, metadata } = flowInfo;

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
      };

      if (metadata) {
        flow.metadata = metadata;
      }

      const orphanNode = nodes.find(result => result.node && result.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE &&
        result.node.parents.length === 0);
      if (orphanNode) {
        flow.paths.root = {};
        flow.paths.root.is = orphanNode.node.id;
      }

      if (schemas) {
        flow.schemas = {};
      }

      nodes.concat(branches).forEach((element) => {
        flow.paths.nodes[element.node.id] = element.node;
      });

      items.forEach((element) => {
        element.node.name = get(element, 'cli.name', element.node.name);
        element.node.description = get(element, 'cli.description', element.node.description);
        flow.items[element.node.id || element.node.nodeId] = element.node;
        if (schemas && element.cli && !isSubflowTask(element.cli.type)) {
          flow.schemas[element.node.ref] = schemas.find((tile) => {
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

  getFlowParts(installedTiles, tasks, links) {
    const nodes = [];
    const items = [];
    const branches = [];

    try {

      tasks.forEach((task) => {
        const nodeItem = NodeFactory.makeItem({ taskID: task.id });

        let installedActivity = installedTiles.find(tile => tile.ref === task.activityRef);
        if (isSubflowTask(task.type)) {
          installedActivity = { ref: CONTRIB_REF_PLACEHOLDER.REF_SUBFLOW };

          if (task.inputMappings) {
            // If the flow is still available get the inputs of a subflow from its latest definition
            // else consider an empty array as flow inputs.
            const subflowSchema = this.subflowSchemaRegistry.get(task.settings.flowPath);
            const subflowInputs = (subflowSchema && subflowSchema.metadata && subflowSchema.metadata.input) || [];
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
        const itemActivity = ItemFactory.makeItem({ node: nodeItem, taskInstance: task, activitySchema: installedActivity });

        nodes.push({ node: nodeItem, cli: task });
        items.push({ node: itemActivity, cli: task });
      });

      // add branches
      links.forEach((link) => {
        if (link.type === FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH) {
          const branchNode = NodeFactory.makeBranch();
          const branchItem = ItemFactory.makeBranch({ taskID: branchNode.taskID, condition: link.value });
          // get connectors points
          const nodeFrom = nodes.find(result => result.cli.id === link.from);
          const nodeTo = nodes.find(result => result.cli.id === link.to);

          branches.push({ node: branchNode, connector: { from: nodeFrom.cli.id, to: nodeTo.cli.id } });
          items.push({ node: branchItem, cli: null, connector: null });
        }
      });


      const nodeLinks = links.filter(link => link.type !== FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH);
      const branchesLinks = links.filter(link => link.type === FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH);
      linkTiles(nodes, nodeLinks);

      linkBranches(branches, nodes, branchesLinks);
    } catch (error) {
      console.error('Function getFlowParts:', error);
      throw error;
    }

    return { nodes, items, branches };

    function linkTiles(inputNodes, inputLinks) {
      try {
        inputLinks.forEach((link) => {
          const from = inputNodes.find(result => result.cli.id === link.from);
          const to = inputNodes.find(result => result.cli.id === link.to);
          linkNodes(from.node, to.node);
        });
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
    const nodeTrigger = NodeFactory.makeTrigger();
    const itemTrigger = ItemFactory.makeTrigger({
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

class NodeFactory {
  static makeTrigger() {
    return Object.assign({}, this.getSharedProperties(), {
      type: FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT, taskID: flogoGenTriggerID()
    });
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
    return uniqueId(`Flogo::Branch::${Date.now()}::`);
  }
}

class ItemFactory {

  static getDefaultTaskProperties(installed) {
    const defaults = {
      name: '',
      description: '',
      settings: {},
      ref: '',
      __props: {
        errors: [],
      },
      __status: {}
    };
    return Object.assign({}, defaults, pick(installed, ['name', 'description', 'ref']));
  }

  static getDefaultTriggerProperties(installed) {
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
    return Object.assign({}, defaults, pick(installed, ['name', 'version', 'homepage', 'description', 'ref']));
  }

  static makeTrigger(trigger): any {
    // todo: what does cli means in this context??
    const { installed, cli, endpointSetting } = trigger;
    const item = Object.assign({}, this.getDefaultTriggerProperties(installed), { id: trigger.node.taskID }, {
      nodeId: trigger.node.taskID, type: FLOGO_TASK_TYPE.TASK_ROOT, triggerType: installed.name, settings: [],
    });

    const settings = get(cli, 'settings', {});
    const triggerSchemaSettings = isArray(installed.settings) ? installed.settings : [];
    item.settings = mergeAttributesWithSchema(settings, triggerSchemaSettings);

    const endpointSettings = get(installed, 'endpoint.settings', []);
    item.endpoint.settings = mergeAttributesWithSchema(endpointSetting.settings || {}, endpointSettings);

    const mapType = prop => ({
      name: prop.name,
      type: prop.type || ValueType.String,
    });
    // -----------------
    // set outputs
    const outputs = installed.outputs || [];
    item.outputs = outputs.map(mapType);

    const reply = installed.reply || [];
    item['reply'] = reply.map(mapType);

    return item;
  }

  static makeItem(activitySource: {node, activitySchema, taskInstance}): ItemTask {
    const { node, activitySchema, taskInstance } = activitySource;

    const attributes = taskInstance.attributes || [];

    const item: ItemActivityTask = {
      ...this.getDefaultTaskProperties(activitySchema),
      inputMappings: taskInstance.inputMappings || [],
      id: node.taskID,
      type: FLOGO_TASK_TYPE[taskInstance.type] ? FLOGO_TASK_TYPE[FLOGO_TASK_TYPE[taskInstance.type]] : FLOGO_TASK_TYPE.TASK,
      settings: taskInstance.settings || {},
      return: !!activitySchema.return,
      input: fromPairs(attributes.map(attr => [attr.name, attr.value])),
    };
    return item;
  }

  static makeBranch(branch) {
    return {
      id: branch.taskID, type: FLOGO_TASK_TYPE.TASK_BRANCH, condition: branch.condition,
    };
  }
}

function mergeAttributesWithSchema(properties: { [key: string]: any }, schemaAttributes: any[]) {
  return schemaAttributes.map(attribute => {
    const mappedAttribute = cloneDeep(attribute);
    if (properties[attribute.name]) {
      mappedAttribute.value = properties[attribute.name];
    }
    return mappedAttribute;
  });
}
