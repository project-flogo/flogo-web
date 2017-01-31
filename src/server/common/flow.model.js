import _ from 'lodash';

import { flogoIDEncode, convertTaskID } from '../common/utils';
import { FLOGO_PROCESS_TYPE, FLOGO_TASK_TYPE, FLOGO_TASK_ATTRIBUTE_TYPE, FLOGO_FLOW_DIAGRAM_NODE_TYPE, FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE } from '../common/constants';

const DEFAULT_FLOW_MODEL_REF = 'github.com/TIBCOSoftware/flogo-contrib/action/flow';

/**
 *
 * @param inFlow
 * @param options {object} optional
 * @params.useRef {boolean} (Deprecated) Toggles between using activityRef and activityType.
 * Exists for historical reasons, allows to output flow format for older engine versions when
 * set to false. Defaults to true.
 * @return {{}}
 */
export function flogoFlowToJSON(inFlow, options = { useRef: true }) {
  const REF_FIELD = options.useRef ? { NAME: 'activityRef', FROM: '__schema.where' } : { NAME: 'activityType', FROM: 'activityType' };

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
  }// explicit name?
  flowJSON.id = flogoIDEncode(flowID);
  flowJSON.name = _.get(inFlow, 'name', '');
  flowJSON.description = _.get(inFlow, 'description', '');
  if (options.useRef) {
    flowJSON.id = flowJSON.name ? _.snakeCase(flowJSON.name) : flowJSON.id;
    flowJSON.ref = DEFAULT_FLOW_MODEL_REF;
  }

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
        [REF_FIELD.NAME]: '', // activityRef or activityType
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

  if(_hasExplicitReply(flowJSON.flow && flowJSON.flow.rootTask && flowJSON.flow.rootTask.tasks)) {
    flowJSON.flow.explicitReply = true;
  }

  let errorItems = _.get( inFlow, 'errorHandler.items' );
  let errorPath = _.get( inFlow, 'errorHandler.paths' );

  if(!_.isEmpty(errorPath) && !_.isEmpty(errorItems)) {
    flowJSON.flow.errorHandlerTask = (function _parseErrorTask() {

      let errorPathRoot = _.get( errorPath, 'root' );
      let errorPathNodes = _.get( errorPath, 'nodes' );

      let rootNode = errorPathNodes[ errorPathRoot.is ];
      let errorTask = {
        id : convertTaskID(rootNode.taskID), // TODO
        type : FLOGO_TASK_TYPE.TASK, // this is 1
        [REF_FIELD.NAME]: '',
        name : 'error_root',
        tasks : [],
        links : []
      };

      _traversalDiagram( rootNode, errorPathNodes, errorItems, errorTask.tasks, errorTask.links );

      return errorTask;
    }());
  }

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
          taskInfo[REF_FIELD.NAME] = _.get(task, REF_FIELD.FROM);
          taskInfo.type = task.type;
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

  function _hasExplicitReply(tasks)  {
    if(!tasks) {
      return false;
    }

    // hardcoding the activity type, for now
    // TODO: maybe the activity should expose a property so we know it can reply?
    return !!_.find(tasks, task => task.activityType == 'tibco-reply');

  }

  if (options.useRef) {
    delete flowJSON.flow.name;
    delete flowJSON.flow.model;
    flowJSON.data = {
      flow: flowJSON.flow,
    };
    delete flowJSON.flow;
  }

  return flowJSON;
}

/**
 * @param flow
 * @param options
 * @params.useRef {boolean} (Deprecated) Toggles between using triggerRef and triggerType.
 * Exists for historical reasons, allows to output flow format for older engine versions when
 * set to false. Defaults to true.
 * @return {object} exported tirgger object for the flow
 */
export function flogoTriggerToJSON(flow) {
  let result;

  let rootTask = _.find(flow.items, value => value.type === FLOGO_TASK_TYPE.TASK_ROOT);
  if (!rootTask) {
    return null;
  }
  rootTask = _.cloneDeep(rootTask);


  let settings = {};
  let handler = {};
  let handlers = [];

  if (rootTask.settings) {
    rootTask.settings.forEach((setting) => {
      settings[setting.name] = setting.value;
    });
  }

  if (rootTask.endpoint && rootTask.settings) {
    rootTask.endpoint.settings.forEach((setting) => {
      if (setting.value && typeof setting.value !== 'undefined') {
        handler[setting.name] = setting.value;
      }
    });
  }

  if (_.isEmpty(handler)) {
    handlers = null;
  } else {
    handlers.push(handler);
  }

  return {
    id: _.snakeCase(rootTask.name),
    ref:  _.get(rootTask, '__schema.where'),
    // name: rootTask.triggerType,
    data: {
      settings,
      handlers,
    },
  };
}
