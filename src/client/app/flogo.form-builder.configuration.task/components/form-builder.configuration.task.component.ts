import {Component, SimpleChange} from '@angular/core';

import {FlogoFormBuilderCommon} from '../../flogo.form-builder/form-builder.common';
import {FlogoFormBuilderFieldsListBox as FieldListBox} from '../../flogo.form-builder.fields/components/fields.listbox/fields.listbox.component';
import {convertTaskID, parseMapping} from "../../../common/utils";

@Component({
    selector: 'flogo-form-builder-task-configuration',
    moduleId: module.id,
    templateUrl: 'form-builder.configuration.task.tpl.html',
    inputs: ['_fieldObserver:fieldObserver','_attributes:attributes', '_task:task']
})
export class FlogoFormBuilderConfigurationTaskComponent {
  _fieldObserver : any;
  _attributes: any;
  _task:any;
  fields:any;

  constructor(private _commonService: FlogoFormBuilderCommon) {
  }

  ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    this.fields = {
      inputs : this._commonService.getStructureFromAttributes('inputs',  this._attributes),
      outputs: this._commonService.getStructureFromAttributes('outputs', this._attributes),
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

  _getMappingValue(info:any) {
    // if there is results
    let resultValue : any = null;
    if(info.step) {
      let taskId = convertTaskID(this._task.id);
      if (info.direction === 'output') {
        resultValue = _.find(info.step.flow.attributes, (attr:any) => attr.name == `{A${taskId}.${info.name}}`)
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

  //TODO define interface
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
      // subfield where this item is located
      structure: structure,
      allowed: input.allowed
    };

    info.value = this._getMappingValue(info);
    //if(!this._context.isTrigger) {
    //  info.value = this._getMappingValue(info);
    //}

    return _.assign({}, info, this.getControlByType(input));
  }




}
