import { flogoIDEncode, convertTaskID, getDefaultValue } from '../../../common/utils';
import { FLOGO_PROCESS_TYPE, FLOGO_TASK_TYPE, FLOGO_TASK_ATTRIBUTE_TYPE } from '../../../common/constants';
import {
  IFlogoFlowDiagramNode,
  IFlogoFlowDiagramTask,
  IFlogoFlowDiagramTaskAttribute,
  IFlogoFlowDiagramTaskAttributeMapping,
  IFlogoFlowDiagramNodeDictionary,
  IFlogoFlowDiagramTaskDictionary
} from '../models';
import { FLOGO_FLOW_DIAGRAM_NODE_TYPE, FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE } from '../constants';

/**
 * Type definitions for flowToJSON util function
 */

interface flowToJSON_Attribute {
  name : string;
  type : string;
  value : string;
}

interface flowToJSON_Mapping {
  type : number;
  value : string;
  mapTo : string;
}

interface flowToJSON_Task {
  id : number;
  type : number;
  activityType : string;
  name? : string;
  attributes : flowToJSON_Attribute[];
  inputMappings : flowToJSON_Mapping [];
  ouputMappings : flowToJSON_Mapping[];
}

interface flowToJSON_Link {
  id : number;
  type : number;
  from : number;
  to : number;
  name? : string;
  value? : any;
}

interface flowToJSON_Flow {
  id : string;
  name : string;
  description : string;
  flow : flowToJSON_FlowInfo;
}

interface triggerToJSON_TriggerInfo {
  name: string,
  settings: any,
  endpoints: any
}

interface triggerToJSON_Trigger {
  triggers: triggerToJSON_TriggerInfo[]
}

interface flowToJSON_FlowInfo {
  type : number,
  name : string;
  model : string;
  attributes : flowToJSON_Attribute[];
  rootTask : flowToJSON_RootTask,
  errorHandlerTask?: flowToJSON_RootTask,
  explicitReply?: boolean
}

interface flowToJSON_RootTask {
  id : number;
  type : number;
  activityType : string;
  name : string;
  tasks : flowToJSON_Task[];
  links : flowToJSON_Link[];
}

interface flowToJSON_InputFlow {
  _id : string;
  name? : string;
  description? : string;
  attributes? : any[];
  path : {
    root : {
      is : string
    };
    nodes : IFlogoFlowDiagramNodeDictionary,
  };
  items : {
    id : string;
    type : number;
    [key : string] : any;
  }[];
  [key : string] : any;
}

export function triggerFlowToJSON(flow:flowToJSON_InputFlow) : triggerToJSON_Trigger {
       let result:triggerToJSON_Trigger, rootTask:any;

       _.forOwn(flow.items, function (value, key) {
          if(value.type == FLOGO_TASK_TYPE.TASK_ROOT) {
              rootTask = _.cloneDeep(value);
              return false;
          } else {
            return true;
          }
      });

      if(rootTask) {
          let settings = {};
          let endpoint = {};
          let endpoints = [];

          if(rootTask.settings) {
              rootTask.settings.forEach((setting) => {
                  settings[setting.name] = setting.value;
              });
          }

          if(rootTask.endpoint&&rootTask.settings) {
              rootTask.endpoint.settings.forEach((setting) => {
                if(setting.value && typeof setting.value !== 'undefined') {
                  endpoint[setting.name] = setting.value;
                }
              });
          }

          if(_.isEmpty(endpoint)) {
              endpoints = null;
          } else {
              endpoints.push(endpoint);
          }

          let trigger: triggerToJSON_TriggerInfo;
          trigger = {
            name: rootTask.triggerType,
            settings: settings,
            endpoints: endpoints
          };

          result = { triggers: [ trigger ] };
      }

      return result;
}

/**
 * Convert the flow to flow.json
 *
 * @param inFlow
 * @returns {flowToJSON_Flow}
 */
export function flogoFlowToJSON( inFlow : flowToJSON_InputFlow ) : flowToJSON_Flow {
  const DEBUG = false;
  const INFO = true;

  // TODO
  //  task link should only be unique within a flow, hence
  //  for the moment, using the linkCounter to keep increasing the
  //  link number within a session is fine.
  let linkIDCounter = 0;
  let _genLinkID = () => ++linkIDCounter;

  let flowJSON = <flowToJSON_Flow>{};

  /* validate the required fields */

  let flowID = <string>_.get( inFlow, '_id' );

  if ( _.isEmpty( flowID ) ) {
    DEBUG && console.error( 'No id in the given flow' );
    DEBUG && console.log( inFlow );
    return flowJSON;
  }

  let flowPath = <{
    root : {
      is : string
    };
    nodes : IFlogoFlowDiagramNodeDictionary,
  }>_.get( inFlow, 'paths' );

  let flowPathRoot = <{
    is : string
  }>_.get( flowPath, 'root' );

  let flowPathNodes = <IFlogoFlowDiagramNodeDictionary>_.get( flowPath, 'nodes' );

  if ( _.isEmpty( flowPath ) || _.isEmpty( flowPathRoot ) || _.isEmpty( flowPathNodes ) ) {
    DEBUG && console.warn( 'Invalid path information in the given flow' );
    DEBUG && console.log( inFlow );
    return flowJSON;
  }

  let flowItems = <IFlogoFlowDiagramTaskDictionary>_.get( inFlow, 'items' );

  if ( _.isEmpty( flowItems ) ) {
    DEBUG && console.warn( 'Invalid items information in the given flow' );
    DEBUG && console.log( inFlow );
    return flowJSON;
  }

  /* assign attributes */

  flowJSON.id = flogoIDEncode( flowID ); // convert to URL safe base64 encoded id
  flowJSON.name = _.get( inFlow, 'name', '' );
  flowJSON.description = _.get( inFlow, 'description', '' );

  flowJSON.flow = (function _parseFlowInfo() {
    let flow = <flowToJSON_FlowInfo>{};

    flow.name = flowJSON.name; // TODO seems to be redundant
    flow.model = _.get( inFlow, 'model', 'tibco-simple' );
    flow.type = _.get( inFlow, 'type', FLOGO_PROCESS_TYPE.DEFAULT );

    flow.attributes = _parseFlowAttributes( _.get( inFlow, 'attributes', [] ) );

    flow.rootTask = (function _parseRootTask() {
      // in the input flow, the root is the trigger, hence create a rootTask here, and
      // make its id is always 1, along with the following default values;
      //
      //  TODO
      //    1. should handle the attribute mapping of trigger separately,
      //    hence will the rootTask has no mapping for the moment.
      let rootTask = <flowToJSON_RootTask>{
        id : 1,
        type : FLOGO_TASK_TYPE.TASK, // this is 1
        activityType : '',
        name : 'root',
        tasks : <flowToJSON_Task[]>[],
        links : <flowToJSON_Link[]>[]
      };

      let rootNode = flowPathNodes[ flowPathRoot.is ];

      _traversalDiagram( rootNode, flowPathNodes, flowItems, rootTask.tasks, rootTask.links );

      return rootTask;
    }());


    let errorItems = <IFlogoFlowDiagramTaskDictionary>_.get( inFlow, 'errorHandler.items' );
    let errorPath = <{
      root : {
        is : string
      };
      nodes : IFlogoFlowDiagramNodeDictionary,
    }>_.get( inFlow, 'errorHandler.paths' );

    if(_.isEmpty(errorPath) || _.isEmpty(errorItems)) {
      return flow;
    }

    flow.errorHandlerTask = (function _parseErrorTask() {

      let errorPathRoot = <{
        is : string
      }>_.get( errorPath, 'root' );
      let errorPathNodes = <IFlogoFlowDiagramNodeDictionary>_.get( errorPath, 'nodes' );

      let rootNode = errorPathNodes[ errorPathRoot.is ];
      let errorTask = <flowToJSON_RootTask>{
        id : convertTaskID(rootNode.taskID), // TODO
        type : FLOGO_TASK_TYPE.TASK, // this is 1
        activityType : '',
        name : 'error_root',
        tasks : <flowToJSON_Task[]>[],
        links : <flowToJSON_Link[]>[]
      };

      _traversalDiagram( rootNode, errorPathNodes, errorItems, errorTask.tasks, errorTask.links );

      return errorTask;
    }());

    return flow;
  }());

  if(_hasExplicitReply(flowJSON.flow && flowJSON.flow.rootTask && flowJSON.flow.rootTask.tasks)) {
    flowJSON.flow.explicitReply = true;
  }

  INFO && console.log( 'Generated flow.json: ', flowJSON );

  function _traversalDiagram( rootNode : IFlogoFlowDiagramNode,
    nodes : IFlogoFlowDiagramNodeDictionary,
    tasks : IFlogoFlowDiagramTaskDictionary,
    tasksDest : flowToJSON_Task[ ],
    linksDest : flowToJSON_Link[ ] ) : void {

    let visited = < string[ ] > [];

    _traversalDiagramChildren( rootNode, visited, nodes, tasks, tasksDest, linksDest );
  }

  function _traversalDiagramChildren( node : IFlogoFlowDiagramNode,
    visitedNodes : string[ ],
    nodes : IFlogoFlowDiagramNodeDictionary,
    tasks : IFlogoFlowDiagramTaskDictionary,
    tasksDest : flowToJSON_Task[ ],
    linksDest : flowToJSON_Link[ ] ) {
    // if haven't visited
    if ( !_.includes( visitedNodes, node.id ) ) {
      visitedNodes.push( node.id );

      let nodesToGo = _.difference( node.children, visitedNodes );

      _.each( nodesToGo, ( nid ) => {

        let childNode = nodes[ nid ];

        // filter the ADD node
        if ( childNode.type
          === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD
          || childNode.type
          === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW ) {
          return;
        }

        // handle branch node differently
        if ( childNode.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
          let branch = tasks[ childNode.taskID ];

          // single child is found
          //  since branch can has only one direct child, this is the only case to follow
          if ( branch && childNode.children.length === 1 ) {
            DEBUG && console.log( 'Found a branch with activity!' );

            // traversal its children
            _traversalDiagramChildren( childNode, visitedNodes, nodes, tasks, tasksDest, linksDest );
          } else {
            DEBUG && console.warn( '- Found a branch!\n- Don\'t care..' );
          }

          return;
        }

        /*
         * add task
         */

        let task = <IFlogoFlowDiagramTask>tasks[ childNode.taskID ];

        if ( _isValidInternalTaskInfo( task ) ) {
          let taskInfo = <flowToJSON_Task>{};

          taskInfo.id = convertTaskID( task.id );
          taskInfo.name = _.get( task, 'name', '' );
          taskInfo.type = task.type;
          taskInfo.activityType = task.activityType;


          /* add `inputs` of a task to the `attributes` of the taskInfo in flow.json */

          taskInfo.attributes = _parseFlowAttributes( <IFlogoFlowDiagramTaskAttribute[]>_.get( task,
            'attributes.inputs' ) );

          // filter null/undefined/{}/[]
          taskInfo.attributes = _.filter( taskInfo.attributes, ( attr : any )=> {
            return !(_.isNil( attr.value ) || (_.isObject( attr.value ) && _.isEmpty( attr.value )));
          } );

          /* add inputMappings */

          let inputMappings = _parseFlowMappings( <IFlogoFlowDiagramTaskAttributeMapping[]>_.get( task,
            'inputMappings' ) );

          if ( !_.isEmpty( inputMappings ) ) {
            taskInfo.inputMappings = inputMappings;
          }

          /* add outputMappings */

          let outputMappings = _parseFlowMappings( <IFlogoFlowDiagramTaskAttributeMapping[]>_.get( task,
            'outputMappings' ) );

          if ( !_.isEmpty( outputMappings ) ) {
            taskInfo.ouputMappings = outputMappings;
          }

          tasksDest.push( taskInfo );
        } else {
          INFO && console.warn( 'Invalid task found.' );
          INFO && console.warn( task );
        }

        /*
         * add link
         */

        if ( node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE ) {

          linksDest.push( {
            id : _genLinkID(),
            from : convertTaskID( node.taskID ),
            to : convertTaskID( childNode.taskID ),
            type : FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.DEFAULT
          } );

        } else if ( node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH && node.parents.length === 1 ) {

          let parentNode = nodes[ node.parents[ 0 ] ];
          let branch = tasks[ node.taskID ];

          // ignore the case that the parent node of the branch node is the trigger
          //  TODO
          //    seems that the case that branch node is trigger should still be considered to add a branch link
          //    ignore for the moment, will get back to this later
          if ( parentNode.type !== FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT ) {
            // add a branch link
            linksDest.push( {
              id : _genLinkID(),
              from : convertTaskID( parentNode.taskID ),
              to : convertTaskID( childNode.taskID ),
              type : FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE.BRANCH,
              value : branch.condition
            } );
          }

        }

        _traversalDiagramChildren( childNode, visitedNodes, nodes, tasks, tasksDest, linksDest );

      } );
    }
  }

  function _isValidInternalTaskInfo( task : {
    id : string;
    type : FLOGO_TASK_TYPE;
    activityType? : string;
    [key : string] : any;
  } ) : boolean {

    if ( _.isEmpty( task ) ) {
      DEBUG && console.warn( 'Empty task' );
      return false;
    }

    if ( _.isEmpty( task.id ) ) {
      DEBUG && console.warn( 'Empty task id' );
      DEBUG && console.log( task );
      return false;
    }

    if ( !_.isNumber( task.type ) ) {
      DEBUG && console.warn( 'Invalid task type' );
      DEBUG && console.log( task );
      return false;
    }

    if ( _.isEmpty( task.activityType ) ) {
      DEBUG && console.warn( 'Empty task activityType' );
      DEBUG && console.log( task );
      return false;
    }

    return true;
  }

  function _parseFlowAttributes( inAttrs : any[] ) : flowToJSON_Attribute [] {
    let attributes = <flowToJSON_Attribute []>[];

    _.each( inAttrs, ( inAttr : any )=> {
      let attr = <flowToJSON_Attribute>{};

      /* simple validation */
      attr.name = <string>_.get( inAttr, 'name' );
      attr.value = <any>_.get( inAttr, 'value', getDefaultValue( inAttr.type ) );

      if ( _.isEmpty( attr.name ) ) {
        DEBUG && console.warn( 'Empty attribute name found' );
        DEBUG && console.log( inAttr );
        return;
      }

      // NOTE
      //  empty value may be fed from upstream results - mapping
      //  hence comment out this validation
      // if ( !_.isNumber( attr.value ) && !_.isBoolean( attr.value ) && _.isEmpty( attr.value ) ) {
      //   DEBUG && console.warn( 'Empty attribute value found' );
      //   DEBUG && console.log( inAttr );
      //   return;
      // }

      // the attribute default attribute type is STRING
      attr.type = (<string>_.get( FLOGO_TASK_ATTRIBUTE_TYPE,
        <FLOGO_TASK_ATTRIBUTE_TYPE>_.get( inAttr, 'type' ),
        'string' )).toLowerCase();


      attributes.push( attr );
    } );

    return attributes;
  }

  function _parseFlowMappings( inMappings : any[] ) : flowToJSON_Mapping[] {
    let mappings = <flowToJSON_Mapping[]>[];

    _.each( inMappings, ( inMapping : any )=> {
      let mapping = <flowToJSON_Mapping>{};

      /* simple validation */

      mapping.type = <number>_.get( inMapping, 'type' );
      mapping.value = <string>_.get( inMapping, 'value' );
      mapping.mapTo = <string>_.get( inMapping, 'mapTo' );

      if ( _.isUndefined( mapping.type ) ) {
        DEBUG && console.warn( 'Empty mapping type found' );
        DEBUG && console.log( inMapping );
        return;
      }

      if ( _.isEmpty( mapping.value ) ) {
        DEBUG && console.warn( 'Empty mapping value found' );
        DEBUG && console.log( inMapping );
        return;
      }

      if ( _.isEmpty( mapping.mapTo ) ) {
        DEBUG && console.warn( 'Empty mapping mapTo found' );
        DEBUG && console.log( inMapping );
        return;
      }

      // TODO
      //  haven't got the types for mapping, hence of the type of mapping isn't the required integre type,
      //  force it to 1;
      if ( !_.isNumber( mapping.type ) ) {
        INFO && console.warn( `Force invalid mapping type to 1 since it's not a number.` );
        INFO && console.log( mapping );
        mapping.type = 1;
      }

      mappings.push( mapping );
    } );

    return mappings;
  }

  function _hasExplicitReply(tasks?:any) : boolean {
    if(!tasks) {
      return false;
    }

    // hardcoding the activity type, for now
    // TODO: maybe the activity should expose a property so we know it can reply?
    return !!_.find(tasks, task => (<any>task).activityType == 'tibco-reply');

  }

  return flowJSON;
}
