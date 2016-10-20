import {Component, SimpleChange} from '@angular/core';

import {FlogoFormBuilderCommon} from '../../flogo.form-builder/form-builder.common';

@Component({
    selector: 'flogo-form-builder-trigger-configuration',
    moduleId: module.id,
    templateUrl: 'form-builder.configuration.trigger.tpl.html',
    inputs: ['_fieldObserver:fieldObserver','_attributes:attributes']
})
export class FlogoFormBuilderConfigurationTriggerComponent {
  _fieldObserver : any;
  _attributes: any;
  fields:any;

  constructor(private _commonService: FlogoFormBuilderCommon) {
  }

  ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    this.fields = {
      endpointSettings: this._commonService.getStructureFromAttributes('endpointSettings', this._attributes),
      settings:         this._commonService.getStructureFromAttributes('settings', this._attributes),
      outputs:          this._commonService.getStructureFromAttributes('outputs', this._attributes)
    }
  }

  ngOnInit() {
  }

  getControlByType(item:any) :any {

    if(item.allowed) {
      return {control: 'FieldListBox'};
    }

    return this._commonService.getControlByType(item.type);
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
      allowed: input.allowed
    };

    return _.assign({}, info, this.getControlByType(input.type));
  }



}
