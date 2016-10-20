import {Component} from '@angular/core';
import {FlogoFormBuilderFieldsBase} from '../fields.base/fields.base.component';
import {DEFAULT_VALUES_OF_TYPES as DEFAULT_VALUES} from '../../../../common/constants'
import {TranslateService} from 'ng2-translate/ng2-translate';

const EMPTY_OPTION = '<empty>';

@Component({
  selector: 'flogo-form-builder-fields-listbox',
  styleUrls: ['fields.listbox.css','../fields.base/fields.base.css'],
  moduleId: module.id,
  templateUrl: 'fields.listbox.tpl.html',
  inputs:['_info:info','_fieldObserver:fieldObserver']
})

export class FlogoFormBuilderFieldsListBox  extends FlogoFormBuilderFieldsBase {
  _info:any;
  _fieldObserver:any;
  options:any[] = [];


  constructor(_translate: TranslateService) {
    super(_translate);
  }

  ngOnInit() {
    this.options =  [EMPTY_OPTION].concat(this._info.allowed);
  }

  onChangeField(option:string) {
    if (option == EMPTY_OPTION) {
      option = DEFAULT_VALUES[this._info.type];
    }
    this._info.value = option;
    this.publishNextChange();
  }

}
