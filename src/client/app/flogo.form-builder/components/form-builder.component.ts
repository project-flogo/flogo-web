import { Component, SimpleChange } from '@angular/core';
import {ROUTER_DIRECTIVES} from '@angular/router-deprecated';
import {PostService} from '../../../common/services/post.service';
import {BehaviorSubject, ReplaySubject} from 'rxjs/Rx';
import {PUB_EVENTS, SUB_EVENTS} from '../messages';
import {FLOGO_TASK_ATTRIBUTE_TYPE} from '../../../common/constants';
import {FlogoFormBuilderFieldsRadio as FieldRadio} from '../../flogo.form-builder.fields/components/fields.radio/fields.radio.component';
import {FlogoFormBuilderFieldsTextBox as FieldTextBox} from '../../flogo.form-builder.fields/components/fields.textbox/fields.textbox.component';
import {FlogoFormBuilderFieldsParams as FieldParams} from '../../flogo.form-builder.fields/components/fields.params/fields.params.component';
import {FlogoFormBuilderFieldsTextArea as FieldTextArea} from '../../flogo.form-builder.fields/components/fields.textarea/fields.textarea.component';
import {FlogoFormBuilderFieldsNumber as FieldNumber} from '../../flogo.form-builder.fields/components/fields.number/fields.number.component';
import { convertTaskID, parseMapping, normalizeTaskName, getDefaultValue } from "../../../common/utils";
import {Contenteditable} from '../../../common/directives/contenteditable.directive';

@Component({
  selector: 'flogo-form-builder',
  moduleId: module.id,
  styleUrls: ['form-builder.css'],
  templateUrl: 'form-builder.tpl.html',
  directives: [ROUTER_DIRECTIVES, FieldRadio, FieldTextBox, FieldTextArea, FieldNumber, FieldParams, Contenteditable],
  inputs: ['_task:task','_step:step', '_context:context']
})
export class FlogoFormBuilderComponent{
  _fieldObserver:ReplaySubject<any>;
  _task: any;
  _step: any;
  _context: any;
  _subscriptions: any[];
  _canRunFromThisTile: boolean = false;
  _attributes:any;
  _hasChanges:boolean = false;
  _attributesOriginal:any;
  _fieldsErrors:string[];
  _branchConfigs:any[]; // force the fields update by taking the advantage of ngFor

  constructor(private _postService: PostService) {
    this._initSubscribe();
    this._setFieldsObservers();
  }

  private _initSubscribe() {
    this._subscriptions = [];
    //let subs :any[] = [];

    _.each(
      (subs:any, sub:any) => {
        this._subscriptions.push( this._postService.subscribe( sub ) );
      }
    );
  }

  ngOnDestroy() {

    if ( this._hasChanges ) {
      this._saveChangesToFlow();
    }

    _.each( this._subscriptions, (sub:any) => {
        this._postService.unsubscribe( sub );
      }
    );
  }

  _saveActivityChangesToFlow() {

    var state = {
      taskId: this._task.id,
      warnings: []
    };

    if(this._context.isTask) {
      state['inputs'] = this._getCurrentTaskState(this._attributes.inputs);
      state['warnings'] = this.verifyRequiredFields(this._task);
    }

    if(this._context.isTrigger) {
      state['endpointSettings'] = this._getCurrentTaskState(this._attributes.endpointSettings || []);
      state['outputs'] = this._getCurrentTaskState(this._attributes.outputs || []);
      state['settings'] = this._getCurrentTaskState(this._attributes.settings || []);
    }

    this._postService.publish(_.assign({}, PUB_EVENTS.taskDetailsChanged, {
      data: state,
      done: ()=> {
        this._hasChanges  = false;
      }
    }));


  }

  getStructureFromAttributes(structure:string) {
    var returnValue =  _.get(this._attributes, structure, []);

    return this._getArray(returnValue);
  }

  /*
  _saveTriggerChangesToFlow() {
    //let currentOutputs = this._attributesTrigger.outputs;

    let state = {
      taskId: this._task.id,
      endpointSettings: this._getCurrentTaskState(this._attributes.endpointSettings),
      outputs: this._getCurrentTaskState(this._attributes.outputs),
      settings: this._getCurrentTaskState(this._attributes.settings)
    };

    this._postService.publish(_.assign({}, PUB_EVENTS.taskDetailsChanged, {
      data: state,
      done: ()=> {
        this._hasChanges  = false;
      }
    }));
  }
  */

  _saveBranchChangesToFlow() {
    let self = this;
    let branchInfo = this._branchConfigs[ 0 ];
    let state = {
      taskId : branchInfo.id,
      condition : self.convertBranchConditionToInternal( branchInfo.condition,
        _.get( self, '_context.contextData.previousTiles', [] ) )
    };

    this._postService.publish( _.assign( {}, PUB_EVENTS.taskDetailsChanged, {
      data : state,
      done : ()=> {
        this._hasChanges = false;
      }
    } ) );
  }


  _setFieldsObservers() {

    this._fieldObserver = new ReplaySubject(2);

    // handle error status
    this._fieldObserver.filter((param:any) => {
      return param.message == 'validation' && param.payload.status == 'error';
    }).
    subscribe((param:any) => {
      // add to the error array
      if(this._fieldsErrors.indexOf(param.payload.field) == -1) {
        this._fieldsErrors.push(param.payload.field)
      }
    });

    //handle ok validation status
    this._fieldObserver.filter((param:any) => {
      return param.message == 'validation' && param.payload.status == 'ok';
    }).
    subscribe((param:any) => {
      // remove from the error array
      var index  = this._fieldsErrors.indexOf(param.payload.field);
      if(index != -1) {
        this._fieldsErrors.splice(index, 1);
      }
    });

    // when some field changes
    this._fieldObserver.filter((param:any) => {
      return param.message == 'change-field';
    }).
    subscribe((param:any) => {
      this._hasChanges = true;

      if(param.payload.isTask || param.payload.isTrigger) {
          this._updateAttributeByUserChanges(_.get(this._attributes,param.payload.structure,[]), param.payload);
      }
    });

    // handle the change of condition of branch
    this._fieldObserver.filter( ( param : any ) => {
        return param.message == 'change-field' && param.payload.isBranch && param.payload.name === 'condition';
      } )
      .subscribe( ( param : any ) => {
        this._branchConfigs[ 0 ].condition = param.payload.value;
      } );
  }

  _updateAttributeByUserChanges(attributes:any, changedObject:any) {

    var item = _.find(attributes, (field:any) => {
      return field.name === changedObject.name;
    });

    if(item) {
      item.value = changedObject.value
    }

  }

  ngOnChanges() {
    this._setupEnvironment();
  }

  private verifyRequiredFields( task : any ) {
    let warnings = [];

    //  verify if all of the required fields are fulfilled.
    _.some( _.get( this._task, 'attributes.inputs' ), ( input : any ) => {
      if ( input.required && ( (<any>_).isNil( input.value )
          || (_.isString( input.value ) && _.isEmpty( input.value ))
        ) ) {

        //  add configure required msg;
        warnings.push({ msg : 'Configure Required' });
        return true;
      }

      return false;
    } );

    return warnings;
  }

  _setTaskWarnings():void {
    var taskId   = this._task.id;
    var warnings = this.verifyRequiredFields(this._task);


     this._postService.publish(_.assign({},PUB_EVENTS.setTaskWarnings, {
      data: {warnings,  taskId},
      done: () => {}
      } ));



  }

  _setupEnvironment() {
    this._fieldsErrors = [];

    if(!this._context) {
      this._context = {isTrigger:false , isTask: false, isBranch:false,  hasProcess:false, _isDiagramEdited:false };
    }

    this._canRunFromThisTile =  this._getCanRunFromThisTile();


    if(this._context.isTrigger) {
      var attributes : any = {};
      var task = this._task || {};

      attributes['endpointSettings'] =  this._getArray( _.get(task,'endpoint.settings',[])); // ((task['endpoint'] || {})['settings']) || [];
      // override trigger outputs attributes if there is internal values
      //attributesTrigger[ 'outputs' ] = _.get( task, '__props.initData', task[ 'outputs' ] || [] );
      attributes[ 'outputs' ] = this._getArray( _.get( task, 'outputs',  [] ));
      attributes['settings'] = this._getArray(task['settings'] || []);

      this._attributesOriginal = _.cloneDeep(attributes);
      this._setTriggerEnvironment(attributes);
      return;
    }

    if(this._context.isTask) {
      var attributes = this._task ? this._task.attributes || {} : {};
      this._attributesOriginal = _.cloneDeep(attributes);
      this._setTaskEnvironment(attributes);

      setTimeout(()=> {
        this._setTaskWarnings();
      },1000);
      return;
    }

    if (this._context.isBranch) {
      this._setBranchEnvironment(this._task);
    }
  }

  _getCanRunFromThisTile() {
    if(this._context.isTrigger) {
      return true;
    }

    if(this._context.isDiagramEdited) {
       return false;
    }

    return this._context.hasProcess;
  }

  _setTriggerEnvironment(attributes:any) {
    this._attributes = attributes;
  }

  _setTaskEnvironment(attributes:any) {
    this._attributes = { inputs: attributes['inputs'] || [], outputs: attributes['outputs'] || [] };

    this._attributes.inputs.map((input:any) => {   input.mappings = this._task.inputMappings;    input.step  = this._step });
    this._attributes.outputs.map((output:any) => { output.mappings = this._task.outputMappings;  output.step =  this._step });
  }

  _setBranchEnvironment( branchInfo : any ) {
    var self = this;
    this._branchConfigs = [
      _.assign( {},
        {
          id : branchInfo.id,
          condition : self.convertBranchConditionToDisplay( branchInfo.condition,
            _.get( self, '_context.contextData.previousTiles', [] ) )
        } )
    ];
  }

  getControlByType(type:string) {

    switch(this._mapTypeToConstant(type)) {

      case  FLOGO_TASK_ATTRIBUTE_TYPE.STRING:
        return {control: 'FieldTextBox'};

      case FLOGO_TASK_ATTRIBUTE_TYPE.NUMBER:
        return {control:'FieldNumber'};

      case FLOGO_TASK_ATTRIBUTE_TYPE.BOOLEAN:
        return {control:'FieldRadio'};

      case FLOGO_TASK_ATTRIBUTE_TYPE.OBJECT:
        return {control:'FieldTextArea'};

      case FLOGO_TASK_ATTRIBUTE_TYPE.PARAMS:
        return {control:'FieldParams'};

      default:
        return {control:'TextBox'};
    }

  }

  _mapTypeToConstant(type:string|FLOGO_TASK_ATTRIBUTE_TYPE) {

    switch(type) {
      case 'string':
      case FLOGO_TASK_ATTRIBUTE_TYPE.STRING:
        return FLOGO_TASK_ATTRIBUTE_TYPE.STRING;

      case 'number':
      case FLOGO_TASK_ATTRIBUTE_TYPE.NUMBER:
        return FLOGO_TASK_ATTRIBUTE_TYPE.NUMBER;

      case FLOGO_TASK_ATTRIBUTE_TYPE.BOOLEAN:
      case 'boolean':
        return FLOGO_TASK_ATTRIBUTE_TYPE.BOOLEAN;

      case FLOGO_TASK_ATTRIBUTE_TYPE.OBJECT:
      case 'object':
        return FLOGO_TASK_ATTRIBUTE_TYPE.OBJECT;

      case FLOGO_TASK_ATTRIBUTE_TYPE.PARAMS:
      case 'map':
      case 'params':
        return FLOGO_TASK_ATTRIBUTE_TYPE.PARAMS;

      default:
        return FLOGO_TASK_ATTRIBUTE_TYPE.STRING;
    }
  }

  getBranchInfo( branchInfo : any ) {
    var info = {
      name:       'condition',
      id:         branchInfo.id,
      title:      'If',
      value:      branchInfo.condition,
      required:   true,
      placeholder: '',
      isBranch:   true,
      isTrigger: false,
      isTask: false
    };

    return info;
  }

  getTriggerInfo(input:any, direction:string, structure:string) {
    var info = {
      name:       input.name,
      type:       input.type,
      title:      input.title || input.name || '',
      value:      input.value,
      mappings:   input.mappings,
      step:       input.step,
      validation: input.validation,
      validationMessage: input.validationMessage,
      required:   input.required || false,
      placeholder: input.placeholder || '',
      isTask: false,
      isTrigger:  true,
      isBranch:   false,
      direction: direction || '',
      structure: structure || ''
    };


    return _.assign({}, info, this.getControlByType(input.type));
  }


  getTaskInfo(input:any, direction:string, structure:string) {
    var info = {
      name:       input.name,
      type:       input.type,
      title:      input.title || input.name || '',
      value:      input.value,
      mappings:   input.mappings,
      step:       input.step,
      validation: input.validation,
      validationMessage: input.validationMessage,
      required:   input.required || false,
      placeholder: input.placeholder || '',
      isTrigger:  false,
      isBranch:   false,
      isTask: true,
      direction: direction,
      structure: structure
    };

    if(!this._context.isTrigger) {
      info.value = this._getMappingValue(info);
    }

    return _.assign({}, info, this.getControlByType(input.type));
  }

  _getMappingValue(info:any) {
    // if there is results
    let resultValue : any = null;
    if(info.step) {
      let taskId = convertTaskID(this._task.id);
      if (info.direction === 'output') {
        resultValue = _.find(info.step.flow.attributes, (attr:any) => attr.name == `[A${taskId}.${info.name}]`)
      } else {
        // TODO support map to nested attributes
        let mapping = _.find(info.mappings, (mapping:any) => mapping.mapTo === info.name);
        let parsedMapping = mapping ? parseMapping(mapping.value) : null;
        if(parsedMapping) {
          let resultHolder = _.find(info.step.flow.attributes, (attr:any) => {
            return attr.name == parsedMapping.autoMap;
          });
          if(resultHolder) {
            if(parsedMapping.path) {
              resultValue = {
                value: _.get(resultHolder.value, parsedMapping.path)
              };
            } else {
              resultValue = resultHolder;
            }
          }
        }
      }
    }
    return resultValue ? resultValue.value : info.value;
  }

  _getArray(obj:any) {

    if(!Array.isArray(obj)) {
      return [];
    }

    return obj;
  }

  runFromThisTile() {
    // return the id of the task directly, this id is encoded using `flogoIDEncode`, should be handled by subscribers
    var taskId   = this._task.id;
    var inputs = (this._context.isTrigger) ? {} : this._getCurrentTaskState(this._attributes.inputs);

    this._postService.publish(_.assign({},PUB_EVENTS.runFromThisTile, {
      data: {inputs, taskId},
      done: () => {
        this._hasChanges = false;
      }
    } ));

  }

  runFromTrigger() {
    var taskId   = this._task.id;
    var inputs = (this._context.isTrigger) ? {} : this._getCurrentTaskState(this._attributes.inputs);
    this._postService.publish(_.assign({}, PUB_EVENTS.runFromTrigger, {
      data: {inputs, taskId}
    }))
  }

  _getCurrentTaskState(items:any[]) {
       var result :any = {};

      items = this._getArray(items);

       items.forEach((item:any) => {
         result[ item.name ] = _.get( item, 'value', getDefaultValue( item.type ) );
        });

        return result;
  }

  cancelEdit(event:any) {
    if(this._context.isTrigger) {
      this._setTriggerEnvironment(_.cloneDeep(this._attributesOriginal));
    }

    if(this._context.isTask){
      this._setTaskEnvironment(_.cloneDeep(this._attributesOriginal || {}));
    }

    if (this._context.isBranch) {
      this._setBranchEnvironment( this._task || {} );
    }

    this._fieldsErrors = [];
    this._hasChanges = false

  }

  private _saveChangesToFlow() {
    if ( this._context.isTask || this._context.isTrigger) {
      this._saveActivityChangesToFlow();
    }  else if ( this._context.isBranch ) {
      this._saveBranchChangesToFlow();
    }
  }

  saveChanges( event? : any ) {
    this._saveChangesToFlow();
  }

  changeTaskDetail(content: any, proper: string) {
    console.log(content);

    this._postService.publish(_.assign({},PUB_EVENTS.changeTileDetail,
      {
        data: {content: content, proper: proper, taskId:this._task.id}

      }
    ));

  }

  convertBranchConditionToDisplay( condition : string, tiles : any[] ) : string {
    // display format sample: query-a-pet.result.code == 1
    // internal format sample: $[A<taskID>.result].code == 1;

    // ensure condition is in string format
    condition = '' + condition;

    // cases
    //  $[T]
    //  $[A3]
    //  $[T.pathParams]
    //  $[A3.result]
    //  $[T.pathParams].petId
    //  $[A3.result].code
    let reComTriggerLabel = '(T)'; // T
    let reComActivityLabel = '(A)(\\d+)'; // A3
    let reComTaskLabel = `(${reComTriggerLabel}|${reComActivityLabel})`; // T | A3
    let reComPropNameWithoutQuote = '(?:\\$|\\w)+'; // sample: $propName1, _propName1

    let reProp = `(?:\\$\\[${reComTaskLabel}(\\.${reComPropNameWithoutQuote})?\\])((?:\\.${reComPropNameWithoutQuote})*)`;

    let pattern = new RegExp(reProp.replace(/\s/g, ''), 'g');

    let taskIDNameMappings = <any>{};

    _.each( tiles, ( tile : any ) => {
      if ( tile.triggerType ) {
        taskIDNameMappings[ 'T' ] = {
          name : normalizeTaskName( tile.name ),
          triggerType : tile.triggerType,
          activityType : tile.activityType
        };
      } else {
        taskIDNameMappings[ 'A' + convertTaskID( tile.id ) ] = {
          name : normalizeTaskName( tile.name ),
          triggerType : tile.triggerType,
          activityType : tile.activityType
        };
      }
    } );

    condition = condition.replace( pattern,
      ( match : string,
        taskLabel : string,
        triggerTypeLabel : string,
        activityTypeLabel : string,
        taskID : string,
        taskLabelProp : string,
        propPath : string,
        offset : number,
        wholeString : string ) => {

        let taskInfo = taskIDNameMappings[taskLabel];

        if (taskInfo) {
          let labelProp = _['toPath'](taskLabelProp).join('.');
          let props = _['toPath'](propPath).join('.'); // normalise prop paths

          if (labelProp) {
            return props ? `${taskInfo.name}.${labelProp}.${props}` : `${taskInfo.name}.${labelProp}`;
          } else {
            return `${taskInfo.name}`;
          }

        } else {
          return match;
        }
      } );

    return condition;
  }

  convertBranchConditionToInternal( condition : string, tiles : any[] ) : string {
    // display format sample: query-a-pet.result.code == 1
    // internal format sample: $[A<taskID>.result].code == 1;
    
    // ensure condition is in string format
    condition = '' + condition;

    // paths cases
    //  base cases
    //    variable['propName']
    //    variable.propName
    //    variable["prop-name"]
    //  composition cases
    //    variable['propName']["prop-name"]
    //    variable['propName'].propName
    //    variable['propName'].propName["prop-name"]
    //    variable.propName.propName["prop-name"]
    let reComTaskName = '\\w+(?:\\-|\\w)*'; // sample: query-a-pet
    let reComPropNameWithoutQuote = '(?:\\$|\\w)+'; // sample: $propName1, _propName1
    let reComPropNameWithQuote = '(?:[\\$\\-]|\\w)+'; // '(?:\"|\')(?:[\\$\\-]|\\w)+(?:\"|\')'

    let reProp = `(${reComTaskName})
    ((?:
      (?:\\.${reComPropNameWithoutQuote}) |
      (?:\\[
        (?:
          (?:\\"${reComPropNameWithQuote}\\") |
          (?:\\'${reComPropNameWithQuote}\\')
        )\\]
      )
    )+)`;

    let pattern = new RegExp(reProp.replace(/\s/g, ''), 'g');

    let taskNameIDMappings = <any>{};

    _.each( tiles, ( tile : any ) => {
      taskNameIDMappings[ normalizeTaskName( tile.name ) ] = {
        id : convertTaskID( tile.id ),
        triggerType : tile.triggerType,
        activityType : tile.activityType
      }
    } );

    condition = condition.replace( pattern,
      ( match : string, taskName : string, propPath : string, offset : number, wholeString : string ) => {

        let taskInfo = taskNameIDMappings[ normalizeTaskName( taskName ) ];
        if (taskInfo) {
          taskName = taskInfo.activityType ? `A${taskInfo.id}` : `T`;

          let _propPath = _['toPath'](propPath);
          let firstProp = _propPath.shift();

          if ( firstProp ) {
            return _propPath.length ?
                   `$[${taskName}.${firstProp}].${_propPath.join( '.' )}` :
                   `$[${taskName}.${firstProp}]`;
          } else {
            return `$[${taskName}]`;
          }
        } else {
          return match;
        }
      } );

    return condition;
  }
}
