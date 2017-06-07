import { Component, Output, EventEmitter } from '@angular/core';
import { PostService} from '../../../common/services/post.service';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { PUB_EVENTS, SUB_EVENTS } from '../messages';
import { FLOGO_ERROR_ROOT_NAME } from '../../../common/constants';
import { convertTaskID, normalizeTaskName, getDefaultValue } from "../../../common/utils";
import { TranslateService } from 'ng2-translate/ng2-translate';
import { ActivatedRoute } from "@angular/router";
import 'rxjs/add/operator/filter';
import {FLOGO_TASK_ATTRIBUTE_TYPE} from "../../../common/constants";
import {FLOGO_TASK_TYPE} from "../../../common/constants";

@Component({
  selector: 'flogo-form-builder',
  // moduleId: module.id,
  styleUrls: ['form-builder.less'],
  templateUrl: 'form-builder.tpl.html',
  inputs: ['_task:task','_step:step', '_context:context', '_flowId:flowId']
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
  _flowId:string;
  hasErrors : boolean = false;
  @Output() onBuilderAction: EventEmitter<string>;

  constructor(public route: ActivatedRoute, private _postService: PostService, private _translate: TranslateService) {
    this._initSubscribe();
    this._setFieldsObservers();

    this.onBuilderAction = new EventEmitter<string>();

    // same as onDestroy since router is reusing the components instead of destroying them
    // see: https://github.com/angular/angular/issues/7757#issuecomment-236737846
    this.route.params.subscribe(
      params => {
        if ( this._hasChanges ) {
          this._saveChangesToFlow(null);
        }
        this._hasChanges = false;
      }
    );

  }

  private _initSubscribe() {
    this._subscriptions = [];
    let subs = [
      _.assign({}, SUB_EVENTS.updatePropertiesToFormBuilder, {callback: this._updatePropertiesToFormBuilder.bind(this)})
    ];

    _.each(subs, (sub:any) => {
        this._subscriptions.push( this._postService.subscribe( sub ) );
      }
    );
  }

  public onAction(event) {
    this.onBuilderAction.emit(event);
  }

  ngOnDestroy() {
    if ( this._hasChanges ) {
      this._saveChangesToFlow(null);
    }

    _.each( this._subscriptions, (sub:any) => {
        this._postService.unsubscribe( sub );
      }
    );
  }

  _saveActivityChangesToFlow(changedStructure: string) {
    return new Promise((resolve, reject)=> {
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
          data: _.assign({},{id: this._flowId}, state, {changedStructure: changedStructure}) ,
          done: ()=> {
            this._hasChanges  = false;
            resolve();
          }
        }));
    });
  }

  _saveBranchChangesToFlow() {
    return new Promise((resolve, reject) => {
        let diagramId = this._flowId;

        let self = this;
        let branchInfo = this._branchConfigs[ 0 ];
        let state = {
          taskId : branchInfo.id,
          id: diagramId,
          condition : self.convertBranchConditionToInternal( branchInfo.condition,
            _.get( self, '_context.contextData.previousTiles', [] ) )
        };

        this._postService.publish( _.assign( {}, PUB_EVENTS.taskDetailsChanged, {
          data : state,
          done : ()=> {
            this._hasChanges = false;
            resolve();
          }
        }));
    });
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
          this.saveChanges(param.payload.structure);

      }
    });

    // handle the change of condition of branch
    this._fieldObserver.filter( ( param : any ) => {
        return param.message == 'change-field' && param.payload.isBranch && param.payload.name === 'condition';
      } )
      .subscribe( ( param : any ) => {
        this._branchConfigs[ 0 ].condition = param.payload.value;
        this.saveChanges(null);
      } );
  }

  _updateAttributeByUserChanges(attributes:any, changedObject:any) {
    var item = _.find(attributes, (field:any) => {
      return field.name === changedObject.name;
    });

    if(item) {
      item.value = _.isEmpty(changedObject.value) ? null :changedObject.value;
    }

  }

  ngOnChanges(changes:any) {
    this._setupEnvironment();
  }

  private verifyRequiredFields( task : any ) {
    let warnings = [];
    let inputs = [];

    if(task.type === FLOGO_TASK_TYPE.TASK_ROOT) {
      inputs = _.get(this._task, 'settings', []);
      inputs = inputs.concat(_.get(this._task, 'endpoint.settings', []));
    } else {
      if(task.type === FLOGO_TASK_TYPE.TASK) {
        inputs = _.get(this._task, 'attributes.inputs', []);
      }
    }

    //  verify if all of the required fields are fulfilled.
    _.some( inputs , ( input : any ) => {
      if ( input.required && ( (<any>_).isNil( input.value )
          || (_.isString( input.value ) && _.isEmpty( input.value ))
        ) ) {

        //  add configure required msg;
        warnings.push({ msg : this._translate.instant('FORM-BUILDER:CONFIGURE-REQUIRED') });
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
      data: {warnings,  taskId, id:this._flowId},
      done: () => {}
      } ));
  }

  _setupEnvironment() {
    this._fieldsErrors = [];

    if(!this._context) {
      this._context = {isTrigger:false , isTask: false, isBranch:false,  hasProcess:false, _isDiagramEdited:false };
    }

    this._canRunFromThisTile =  this._getCanRunFromThisTile();

    let refresTaskWarnings = () => {

      setTimeout(()=> {
        this._setTaskWarnings();
      },1000);

    };


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
      refresTaskWarnings();
      return;
    }

    if(this._context.isTask) {
      var attributes = this._task ? this._task.attributes || {} : {};
      this._attributesOriginal = _.cloneDeep(attributes);
      this._setTaskEnvironment(attributes);

      refresTaskWarnings();
      return;
    }

    if (this._context.isBranch) {
      this._setBranchEnvironment(this._task);
    }
  }

  _getCanRunFromThisTile() {
    if(this._flowId == 'errorHandler') {
      return false;
    }

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
      data: {inputs, taskId, id:this._flowId},
      done: () => {
        this._hasChanges = false;
      }
    } ));

  }

  runFromTrigger() {
    var taskId   = this._task.id;
    var inputs = (this._context.isTrigger) ? {} : this._getCurrentTaskState(this._attributes.inputs);
    this._postService.publish(_.assign({}, PUB_EVENTS.runFromTrigger, {
      data: {inputs, taskId, id:this._flowId}
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

  private _saveChangesToFlow(changedStructure) {
    if ( this._context.isTask || this._context.isTrigger) {
      return this._saveActivityChangesToFlow(changedStructure);
    }  else if ( this._context.isBranch ) {
      return this._saveBranchChangesToFlow();
    }
    return null;
  }

  saveChanges(changedStructure) {
    console.log('Saving changes');
    return this._saveChangesToFlow(changedStructure);
  }

  changeTaskDetail(content: any, proper: string) {
    console.log(content);

    this._postService.publish(_.assign({},PUB_EVENTS.changeTileDetail,
      {
        data: {
          content: content,
          proper: proper,
          taskId:this._task.id,
          id:this._flowId
        }
      }
    ));

  }

  convertBranchConditionToDisplay( condition : string, tiles : any[] ) : string {
    // display format sample: query-a-pet.result.code == 1
    // internal format sample: ${A<taskID>.result}.code == 1;

    // ensure condition is in string format
    condition = '' + condition;

    // cases
    //  ${T}
    //  ${A3}
    //  ${T.pathParams}
    //  ${A3.result}
    //  ${T.pathParams}.petId
    //  ${A3.result}.code
    //  ${E}
    //  ${E.message}
    //  ${E.data}.name
    let reComTriggerLabel = '(T)'; // T
    let reComActivityLabel = '(A)(\\d+)'; // A3
    let reComErrorLabel = '(E)'; // E
    let reComTaskLabel = `(${reComTriggerLabel}|${reComActivityLabel}|${reComErrorLabel})`; // T | A3 | E
    let reComPropNameWithoutQuote = '(?:\\$|\\w)+'; // sample: $propName1, _propName1

    let reProp = `(?:\\$\\{${reComTaskLabel}(\\.${reComPropNameWithoutQuote})?\\})((?:\\.${reComPropNameWithoutQuote})*)`;

    let pattern = new RegExp(reProp.replace(/\s/g, ''), 'g');

    let taskIDNameMappings = <any>{};

    _.each( tiles, ( tile : any ) => {
      if ( tile.triggerType ) {
        let key = tile.triggerType == FLOGO_ERROR_ROOT_NAME ? 'E' : 'T';
        taskIDNameMappings[key] = {
          name: normalizeTaskName(tile.name),
          triggerType: tile.triggerType,
          activityType: tile.activityType
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
        errorTypeLabel: string,
        taskID : string,
        taskLabelProp : string,
        propPath : string,
        offset : number,
        wholeString : string ) => {

        let taskInfo = taskIDNameMappings[taskLabel];

        if (taskInfo) {

          //delete first dot in the strings for right parsing
          taskLabelProp = taskLabelProp && taskLabelProp[0] == '.' ? taskLabelProp.substring(1) : taskLabelProp;
          propPath = propPath && propPath[0] == '.' ? propPath.substring(1) : propPath;

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
          let taskName;
          if ( taskInfo.triggerType ) {
            taskName = taskInfo.triggerType == FLOGO_ERROR_ROOT_NAME ? 'E' : 'T';
          } else {
            taskName = `A${taskInfo.id}`;
          }

          //delete first dot in the string for right parsing
          propPath = propPath && propPath[0] == '.' ? propPath.substring(1) : propPath;

          let _propPath = _['toPath'](propPath);
          let firstProp = _propPath.shift();

          if ( firstProp ) {
            return _propPath.length ?
                   `$\{${taskName}.${firstProp}\}.${_propPath.join( '.' )}` :
                   `$\{${taskName}.${firstProp}\}`;
          } else {
            return `$\{${taskName}\}`;
          }
        } else {
          return match;
        }
      } );
    return condition;
  }

  _updatePropertiesToFormBuilder(data: any, envelope: any) {
    this._task.name = data.name;
  }
}
