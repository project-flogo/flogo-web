"use strict";
import { flogoIDEncode, convertTaskID } from '../common/utils';
import { FLOGO_PROCESS_TYPE, FLOGO_TASK_TYPE, FLOGO_TASK_ATTRIBUTE_TYPE } from '../common/constants';
import { FLOGO_FLOW_DIAGRAM_NODE_TYPE, FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE } from '../common/constants';

import _ from "lodash";

export function flogoFlowToJSON(inFlow) {
  var DEBUG = false;
  var INFO = true;
  var linkIDCounter = 0;
  var _genLinkID = function () { return ++linkIDCounter; };
  var flowJSON = {};
  var flowID = _.get(inFlow, '_id');
  if (_.isEmpty(flowID)) {
    DEBUG && console.error('No id in the given flow');
    DEBUG && console.log(inFlow);
    return flowJSON;
  }
  var flowPath = _.get(inFlow, 'paths');
  var flowPathRoot = _.get(flowPath, 'root');
  var flowPathNodes = _.get(flowPath, 'nodes');
  if (_.isEmpty(flowPath) || _.isEmpty(flowPathRoot) || _.isEmpty(flowPathNodes)) {
    DEBUG && console.warn('Invalid path information in the given flow');
    DEBUG && console.log(inFlow);
    return flowJSON;
  }
  var flowItems = _.get(inFlow, 'items');
  if (_.isEmpty(flowItems)) {
    DEBUG && console.warn('Invalid items information in the given flow');
    DEBUG && console.log(inFlow);
    return flowJSON;
  }
  flowJSON.id = flogoIDEncode(flowID);
  flowJSON.name = _.get(inFlow, 'name', '');
  flowJSON.description = _.get(inFlow, 'description', '');
  flowJSON.flow = (function _parseFlowInfo() {
    var flow = {};
    flow.name = flowJSON.name;
    flow.model = _.get(inFlow, 'model', 'tibco-simple');
    flow.type = _.get(inFlow, 'type', FLOGO_PROCESS_TYPE.DEFAULT);
    flow.attributes = _parseFlowAttributes(_.get(inFlow, 'attributes', []));
    flow.rootTask = (function _parseRootTask() {
      var rootTask = {
        id: 1,
        type: FLOGO_TASK_TYPE.TASK,
        activityType: '',
        name: 'root',
        tasks: [],
        links: []
      };
      var rootNode = flowPathNodes[flowPathRoot.is];
      _traversalDiagram(rootNode, flowPathNodes, flowItems, rootTask.tasks, rootTask.links);
      return rootTask;
    }());
    return flow;
  }());
  INFO && console.log('Generated flow.json: ', flowJSON);
  function _traversalDiagram(rootNode, nodes, tasks, tasksDest, linksDest) {
    var visited = [];
    _traversalDiagramChildren(rootNode, visited, nodes, tasks, tasksDest, linksDest);
  }
  function _traversalDiagramChildren(node, visitedNodes, nodes, tasks, tasksDest, linksDest) {
    if (!_.includes(visitedNodes, node.id)) {
      visitedNodes.push(node.id);
      var nodesToGo = _.difference(node.children, visitedNodes);
      _.each(nodesToGo, function (nid) {
        var childNode = nodes[nid];
        if (childNode.type
          === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD
          || childNode.type
          === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW) {
          return;
        }
        if (childNode.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH) {
          var branch = tasks[childNode.taskID];
          if (branch && childNode.children.length === 1) {
            DEBUG && console.log('Found a branch with activity!');
            _traversalDiagramChildren(childNode, visitedNodes, nodes, tasks, tasksDest, linksDest);
          }
          else {
            DEBUG && console.warn('- Found a branch!\n- Don\'t care..');
          }
          return;
        }
        var task = tasks[childNode.taskID];
        if (_isValidInternalTaskInfo(task)) {
          var taskInfo = {};
          taskInfo.id = convertTaskID(task.id);
          taskInfo.name = _.get(task, 'name', '');
          taskInfo.type = task.type;
          taskInfo.activityType = task.activityType;
          taskInfo.attributes = _parseFlowAttributes(_.get(task, 'attributes.inputs'));
          var inputMappings = _parseFlowMappings(_.get(task, 'inputMappings'));
          if (!_.isEmpty(inputMappings)) {
            taskInfo.inputMappings = inputMappings;
          }
          var outputMappings = _parseFlowMappings(_.get(task, 'outputMappings'));
          if (!_.isEmpty(outputMappings)) {
            taskInfo.ouputMappings = outputMappings;
          }
          tasksDest.push(taskInfo);
        }
        else {
          INFO && console.warn('Invalid task found.');
          INFO && console.warn(task);
        }
        if (node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE) {
          linksDest.push({
            id: _genLinkID(),
            from: convertTaskID(node.taskID),
            to: convertTaskID(childNode.taskID),
            type: FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.DEFAULT
          });
        }
        else if (node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH && node.parents.length === 1) {
          var parentNode = nodes[node.parents[0]];
          var branch = tasks[node.taskID];
          if (parentNode.type !== FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT) {
            linksDest.push({
              id: _genLinkID(),
              from: convertTaskID(parentNode.taskID),
              to: convertTaskID(childNode.taskID),
              type: FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH,
              value: branch.condition
            });
          }
        }
        _traversalDiagramChildren(childNode, visitedNodes, nodes, tasks, tasksDest, linksDest);
      });
    }
  }
  function _isValidInternalTaskInfo(task) {
    if (_.isEmpty(task)) {
      DEBUG && console.warn('Empty task');
      return false;
    }
    if (_.isEmpty(task.id)) {
      DEBUG && console.warn('Empty task id');
      DEBUG && console.log(task);
      return false;
    }
    if (!_.isNumber(task.type)) {
      DEBUG && console.warn('Invalid task type');
      DEBUG && console.log(task);
      return false;
    }
    if (_.isEmpty(task.activityType)) {
      DEBUG && console.warn('Empty task activityType');
      DEBUG && console.log(task);
      return false;
    }
    return true;
  }
  function _parseFlowAttributes(inAttrs) {
    var attributes = [];
    _.each(inAttrs, function (inAttr) {
      var attr = {};
      attr.name = _.get(inAttr, 'name');
      attr.value = _.get(inAttr, 'value');
      if (_.isEmpty(attr.name)) {
        DEBUG && console.warn('Empty attribute name found');
        DEBUG && console.log(inAttr);
        return;
      }
      let enumType = _.get(inAttr, 'type');
      let type = _.findKey(FLOGO_TASK_ATTRIBUTE_TYPE, val => val == enumType);
      attr.type = type ? type.toLowerCase() : 'string';
      attributes.push(attr);
    });
    return attributes;
  }
  function _parseFlowMappings(inMappings) {
    var mappings = [];
    _.each(inMappings, function (inMapping) {
      var mapping = {};
      mapping.type = _.get(inMapping, 'type');
      mapping.value = _.get(inMapping, 'value');
      mapping.mapTo = _.get(inMapping, 'mapTo');
      if (_.isUndefined(mapping.type)) {
        DEBUG && console.warn('Empty mapping type found');
        DEBUG && console.log(inMapping);
        return;
      }
      if (_.isEmpty(mapping.value)) {
        DEBUG && console.warn('Empty mapping value found');
        DEBUG && console.log(inMapping);
        return;
      }
      if (_.isEmpty(mapping.mapTo)) {
        DEBUG && console.warn('Empty mapping mapTo found');
        DEBUG && console.log(inMapping);
        return;
      }
      if (!_.isNumber(mapping.type)) {
        INFO && console.warn("Force invalid mapping type to 1 since it's not a number.");
        INFO && console.log(mapping);
        mapping.type = 1;
      }
      mappings.push(mapping);
    });
    return mappings;
  }
  return flowJSON;
}
