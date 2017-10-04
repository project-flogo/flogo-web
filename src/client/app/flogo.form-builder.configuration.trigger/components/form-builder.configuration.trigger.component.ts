import {Component, SimpleChange, Output, EventEmitter} from '@angular/core';

import {FlogoFormBuilderCommon} from '../../flogo.form-builder/form-builder.common';
import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
    selector: 'flogo-form-builder-trigger-configuration',
    // moduleId: module.id,
    templateUrl: 'form-builder.configuration.trigger.tpl.html',
    inputs: ['_fieldObserver:fieldObserver','_attributes:attributes', '_context:context'],
    styleUrls: ['form-builder.configuration.trigger.less']
})
export class FlogoFormBuilderConfigurationTriggerComponent {
  _fieldObserver : any;
  _attributes: any;
  _context: any;
  fields:any;
  directions:any;
  needEditConfirmation: boolean = false;
  messageNumFlowsUsed: string;
  isEditable: boolean;
  @Output() onTriggerAction : EventEmitter<string>;

  constructor(private _commonService: FlogoFormBuilderCommon,
              public translate: TranslateService) {
    this.isEditable = false;
    this.directions = _commonService.getParameterDirections();
    this.onTriggerAction = new EventEmitter<string>();
  }

  updateMessageNumFlowsUsed(numFlows) {
    if(numFlows > 1) {
      this.needEditConfirmation = true;
      this.isEditable = false;
    } else {
      this.needEditConfirmation = false;
      this.clickEditForNFlows();
    }
    this.messageNumFlowsUsed = this.translate.instant('FORM-BUILDER-CONFIGURATION-TRIGGER:EDIT', {value: numFlows});
  }

  clickEditForNFlows(event?) {
    this.isEditable = true;
    this.onTriggerAction.emit('trigger-edit');
  }

  clickMakeCopy(event) {
    this.onTriggerAction.emit('trigger-copy');
  }


  ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    let numFlows: number;

    if(changes['_context']) {
      try {
        if(this._context.currentTrigger) {
          numFlows = this._context.currentTrigger.handlers.length;
        }
      }catch(err) {
        numFlows = 1;
        console.log(err);
      }
      this.updateMessageNumFlowsUsed(numFlows);
    }
    this.fields = {
      endpointSettings: this._commonService.getStructureFromAttributes('endpointSettings', this._attributes),
      settings:         this._commonService.getStructureFromAttributes('settings', this._attributes),
      outputs:          this._commonService.getStructureFromAttributes('outputs', this._attributes)
    }
  }

  ngOnInit() {
  }

  getControlByType(item:any, parameterDirection?:string) :any {
    return this._commonService.getControlByType(item,parameterDirection);
  }

  //TODO define interface
  getTriggerInfo(input:any, direction:string, structure:string) : any {

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
      // subfield where this item is located
      structure: structure || '',
      allowed: input.allowed,
      isEditable:  structure === 'settings' ? this.isEditable : true
    };

    return _.assign({}, info, this.getControlByType(input.type));
  }

}
