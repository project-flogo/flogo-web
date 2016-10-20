import {Component} from '@angular/core';
import {FlogoFormBuilderFieldsBase} from '../fields.base/fields.base.component';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
  selector: 'flogo-form-builder-fields-radio',
  styleUrls: ['fields.radio.css','../fields.base/fields.base.css'],
  moduleId: module.id,
  templateUrl: 'fields.radio.tpl.html',
  inputs:['_info:info','_fieldObserver:fieldObserver', '_index:index']
})

export class FlogoFormBuilderFieldsRadio extends FlogoFormBuilderFieldsBase {
  _info:any;
  _fieldObserver:any;
  _index: number;
  constructor(_translate: TranslateService) {
    super(_translate);
  }

}
