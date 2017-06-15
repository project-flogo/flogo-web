import { Response, ResponseOptions } from '@angular/http';
import {
  FLOGO_TASK_TYPE,
  FLOGO_TASK_ATTRIBUTE_TYPE,
  DEFAULT_VALUES_OF_TYPES,
  FLOGO_AUTOMAPPING_FORMAT
} from './constants';
import {
  FlogoFlowDiagram,
  IFlogoFlowDiagramNodeDictionary,
  IFlogoFlowDiagramTaskDictionary,
  IFlogoFlowDiagramNode
} from '../app/flogo.flows.detail.diagram/models';

//Refactoring data. Extracting functions related with branch creation in a different file.
export * from '../app/flogo.flows.detail.diagram/utils';


// URL safe base64 encoding
// reference: https://gist.github.com/jhurliman/1250118
export function flogoIDEncode( id : string ) : string {
  return btoa( id )
    .replace( /\+/g, '-' )
    .replace( /\//g, '_' )
    .replace( /=+$/, '' );
}

// URL safe base64 decoding
// reference: https://gist.github.com/jhurliman/1250118
export function flogoIDDecode( encodedId : string ) : string {

  encodedId = encodedId.replace( /-/g, '+' )
    .replace( /_/g, '/' );

  while ( encodedId.length % 4 ) {
    encodedId += '=';
  }

  return atob( encodedId );
}

export function flogoGenTaskID( items? : any ) : string {
  let taskID : string;
  // TODO
  //  generate a more meaningful task ID in string format
  if ( items ) {
    let ids = _.keys( items );
    let startPoint = 2; // taskID 1 is reserved for the rootTask

    let taskIDs = _.map( _.filter( ids, ( id : string ) => {
      let type = items[ id ].type;
      return type === FLOGO_TASK_TYPE.TASK || type === FLOGO_TASK_TYPE.TASK_ROOT;
    } ), ( id : string )=> {
      return _[ 'toNumber' ]( flogoIDDecode( id ) );
    } );

    let currentMax = _.max( taskIDs );

    if ( currentMax ) {
      taskID = '' + ( currentMax + 1);
    } else {
      taskID = '' + startPoint;
    }

  } else {
    // shift the timestamp for avoiding overflow 32 bit system
    taskID = '' + (Date.now() >>> 1);
  }

  return flogoIDEncode( taskID );
}

export function flogoGenBranchID() : string {
  return flogoIDEncode( `Flogo::Branch::${Date.now()}` );
}

export function flogoGenTriggerID() : string {
  return flogoIDEncode( `Flogo::Trigger::${Date.now()}` );
}

/**
 * Convert task ID to integer, which is the currently supported type in engine
 * TODO
 *  taskID should be string in the future, perhaps..
 *
 * @param taskID
 * @returns {number}
 * @private
 */
export function convertTaskID(taskID : string ) {
  let id = '';

  try {
    id = flogoIDDecode( taskID );

    // get the timestamp
    let parsedID = id.split( '::' );

    if ( parsedID.length >= 2 ) {
      id = parsedID[ 1 ];
    }
  } catch ( e ) {
    console.warn( e );
    id = taskID;
  }

  return parseInt( id );
}

// get default value of a given type
export function getDefaultValue( type : FLOGO_TASK_ATTRIBUTE_TYPE ) : any {
  return DEFAULT_VALUES_OF_TYPES[ type ];
}

// convert the type of attribute and add default value if enabled
function portAttribute( inAttr : {
  type : string;
  value : any;
  [key : string] : any;
}, withDefault = false ) {

  let outAttr = <{
    type : any;
    value : any;
    [key : string] : any;
  }>_.assign( {}, inAttr );

  outAttr.type = <FLOGO_TASK_ATTRIBUTE_TYPE>_.get( FLOGO_TASK_ATTRIBUTE_TYPE,
    _.get( outAttr, 'type', 'STRING' )
      .toUpperCase() );

  if ( withDefault && _.isUndefined( outAttr.value ) ) {
    outAttr.value = getDefaultValue( outAttr.type );
  }

  return outAttr;
}

// mapping from schema.json of activity to the task can be used in flow.json
export function activitySchemaToTask(schema: any) : any {

  let task:any = {
    type: FLOGO_TASK_TYPE.TASK,
    activityType: _.get(schema, 'name', ''),
    ref: schema.ref,
    name: _.get(schema, 'title', _.get(schema, 'name', 'Activity')),
    version: _.get(schema, 'version', ''),
    title: _.get(schema, 'title', ''),
    description: _.get(schema, 'description', ''),
    homepage: _.get(schema, 'homepage', ''),
    attributes: {
      inputs: _.get(schema, 'inputs', []),
      outputs: _.get(schema, 'outputs', [])
    }//,
    //__schema: _.cloneDeep(schema)
  };

  _.each(
    task.attributes.inputs, ( input : any ) => {
      // convert to task enumeration and provision default types
      _.assign( input, portAttribute( input, true ) );
    }
  );

  _.each(
    task.attributes.outputs, ( output : any ) => {
      // convert to task enumeration and provision default types
      _.assign( output, portAttribute( output ) );
    }
  );

  return task;
}

// mapping from schema.json of activity to the trigger can be used in flow.json
export function activitySchemaToTrigger(schema: any) : any {

  let trigger:any = {
    type: FLOGO_TASK_TYPE.TASK_ROOT,
    triggerType: _.get(schema, 'name', ''),
    ref: schema.ref,
    name: _.get(schema, 'title', _.get(schema, 'name', 'Activity')),
    version: _.get(schema, 'version', ''),
    title: _.get(schema, 'title', ''),
    description: _.get(schema, 'description', ''),
    homepage: _.get(schema, 'homepage', ''),
    settings: _.get(schema, 'settings', ''),
    outputs: _.get(schema, 'outputs', ''),
    endpoint: { settings: _.get(schema, 'endpoint.settings', '') } //,
    //__schema: _.cloneDeep(schema)
  };

  _.each(
    trigger.inputs, ( input : any ) => {
      // convert to task enumeration and provision default types
      _.assign( input, portAttribute( input, true ) );
    }
  );

  _.each(
    trigger.outputs, ( output : any ) => {
      // convert to task enumeration and provision default types
      _.assign( output, portAttribute( output ) );
    }
  );


  return trigger;
}

// todo: name and location are too general and use case too specific
export function objectFromArray(arr, copyValues?) {
  let mappedSettings = {};
  let settings = arr || [];

  settings.forEach((setting) => {
    mappedSettings[setting.name] = copyValues ?  setting.value : null;
  });

  return mappedSettings;
}

export function normalizeTaskName(taskName:string) {
  return _.kebabCase(taskName);
}

export function parseMapping(automapping:string){
  let matches = FLOGO_AUTOMAPPING_FORMAT.exec(automapping);
  if (!matches) {
    return null;
  }

  let taskId = matches[2] || null;
  let attributeName = matches[3];
  let path = matches[4] ? _.trimStart(matches[4], '.') : null;

  return {
    autoMap: `{${matches[1]}.${attributeName}}`,
    isRoot: !taskId,
    taskId,
    attributeName,
    path
  };

}

export function updateFlogoGlobalConfig( config : any ) {
  (<any>window).FLOGO_GLOBAL = config;

  if ( localStorage ) {
    localStorage.setItem( 'FLOGO_GLOBAL', JSON.stringify( config ) );
  }
}

export function resetFlogoGlobalConfig() {
  // set default value
  updateFlogoGlobalConfig( {
    db : {
      // protocol : 'http',
      // host : 'localhost',
      port : '5984',
      name : 'flogo-web'
    },
    activities : {
      db : {
        // protocol : 'http',
        // host : 'localhost',
        port : '5984',
        name : 'flogo-web-activities'
      }
    },
    triggers : {
      db : {
        // protocol : 'http',
        // host : 'localhost',
        port : '5984',
        name : 'flogo-web-triggers'
      },
    },
    /*
    models : {
      db : {
        // protocol : 'http',
        // host : 'localhost',
        port : '5984',
        name : 'flogo-web-models'
      },
    },*/
    engine : {
      // protocol : 'http',
      // host : "localhost",
      port : "8080",
      testPath: "status"
    },
    stateServer : {
      // protocol : 'http',
      // host : "localhost",
      port : "9190",
      testPath: "ping"
    },
    flowServer : {
      // protocol : 'http',
      // host : "localhost",
      port : "9090",
      testPath: "ping"
    }
  } );
}

export function formatServerConfiguration(config:any) {
  return {
    db : {
      protocol: config.db.protocol,
      host: config.db.host,
      port : config.db.port,
      name : config.db.testPath,
      label: config.db.label
    },
    activities : {
      protocol: config.activities.protocol,
      host: config.activities.host,
      port: config.activities.port,
      testPath: config.activities.testPath,
      label: config.activities.label,
      db : {
        port : config.activities.port,
        name : config.activities.testPath
      }
    },
    triggers : {
      protocol: config.triggers.protocol,
      host: config.triggers.host,
      port: config.triggers.port,
      testPath: config.triggers.testPath,
      label: config.triggers.label,
      db : {
        port : config.triggers.port,
        name : config.triggers.testPath
      },
    },
    engine : {
      protocol : config.engine.protocol,
      host : config.engine.host,
      port : config.engine.port,
      testPath: config.engine.testPath
    },
    stateServer : {
      protocol : config.stateServer.protocol,
      host : config.stateServer.host,
      port : config.stateServer.port,
      testPath:config.stateServer.testPath
    },
    flowServer : {
      protocol : config.flowServer.protocol,
      host : config.flowServer.host,
      port : config.flowServer.port,
      testPath: config.flowServer.testPath
    }
  }
}

export function getFlogoGlobalConfig() : any {

  if ( !(<any>window).FLOGO_GLOBAL ) {
    let config : any;

    if ( localStorage ) {
      config = localStorage.getItem( 'FLOGO_GLOBAL' );

      if ( config ) {

        try {
          config = JSON.parse( config );
        } catch ( e ) {
          console.warn( e );
        }

        updateFlogoGlobalConfig( config );

        return config;
      }
    }

    resetFlogoGlobalConfig();
  }

  return (<any>window).FLOGO_GLOBAL;
}

export function getURL( config : {
  protocol? : string;
  host? : string;
  port? : string;
} ) : string {
  if ( config.port ) {
    return `${config.protocol || location.protocol.replace( ':', '' )}://${config.host || location.hostname}:${config.port}`;
  } else {
    return `${config.protocol || location.protocol.replace( ':', '' )}://${config.host || location.hostname}}`;
  }
}



export function getDBURL( dbConfig : {
  port : string;
  protocol : string;
  host : string;name : string
} ) : string {
  return `${getURL( dbConfig )}/${dbConfig.name}`;
}

/**
 * Copies content of an element into the system clipboard.
 * (Taken from UI cloud pattern library)
 *
 * Not all browsers may be supported. See the following for details:
 * http://caniuse.com/clipboard
 * https://developers.google.com/web/updates/2015/04/cut-and-copy-commands
 * @param  {HTMLElement} element The element containing the text to copy
 * @return {boolean} whether the copy operation is succeeded
 */
export function copyToClipboard(element:HTMLElement) {
  var sel = window.getSelection();
  var snipRange = document.createRange();
  snipRange.selectNodeContents(element);
  sel.removeAllRanges();
  sel.addRange(snipRange);
  var res = false;
  try {
    res = document.execCommand('copy');
  } catch (err) {
    // copy command is not available
    console.error(err);
  }
  sel.removeAllRanges();
  return res;
}

/**
 * Create a notification
 *
 * @param message
 * @param type: information, success, warming, error
 * @param time: the time to autoclose; if not configured, the notification wouldn't be autoclosed.
 * @param settings: inline styles
 */
export function notification(message: string, type: string, time?: number, settings ?: any) {
  let styles = '';
  for (let key in settings) {
    styles += key + ':' + settings[key] + ';'
  }
  let template = `<div style="${styles}" class="${type} flogo-common-notification">${message}`;
  if(!time) {
    template += `
    <i class="fa fa-times flogo-common-notification-close"></i>
    `
  }
  template += '</div>';
  let notificationContainer = jQuery('body > .flogo-common-notification-container');
  if(notificationContainer.length) {
    notificationContainer.append(template);
  } else {
    jQuery('body').append(`<div class="flogo-common-notification-container">${template}</div>`);
  }
  let notification = jQuery('.flogo-common-notification-container>div:last');
  let notifications =  jQuery('.flogo-common-notification-container>div');
  let maxCounter = 5;

  if(notifications.length > 5) {
    for(let i = 0; i < notifications.length - maxCounter; i++) {
      if(notifications[i]) notifications[i].remove();
    }
  }
  setTimeout(function () {
    notification.addClass('on');
  }, 100);
  return new Promise((resolve, reject) => {
    if(time) {
      setTimeout(function () {
        if(notification) notification.remove();
        if(!notificationContainer.html()) notificationContainer.remove();
      }, time);
    }
    if(!time) {
      notification.find('.flogo-common-notification-close').click(() => {
        notification.remove();
        resolve();
      });
    } else {
      resolve();
    }
  })
}

export function attributeTypeToString( inType : any ) : string {
  if ( _.isString( inType ) ) {
    return inType;
  }

  return (FLOGO_TASK_ATTRIBUTE_TYPE[inType] || 'string').toLowerCase();
}

export function updateBranchNodesRunStatus( nodes : IFlogoFlowDiagramNodeDictionary,
  tasks : IFlogoFlowDiagramTaskDictionary ) {

  _.forIn( nodes, ( node : IFlogoFlowDiagramNode ) => {
    const task = tasks[ node.taskID ];

    if ( task.type === FLOGO_TASK_TYPE.TASK_BRANCH ) {
      _.set( task, '__status.hasRun', FlogoFlowDiagram.hasBranchRun( node, tasks, nodes ) );
    }
  } );

}

/**
 * Get the difference between two dates
 *
 * @param beginDate: Inital date
 * @param endDate: Final date
 * @param timeUnit: Measurement unit
 */
export function diffDates(beginDate:any, endDate:any, timeUnit:any) {
  let begin = moment(beginDate);
  let end  = moment(endDate);

  return begin.diff(end, timeUnit);

}





