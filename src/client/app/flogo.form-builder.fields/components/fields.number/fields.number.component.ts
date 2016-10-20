import {Component} from '@angular/core';
import {FlogoFormBuilderFieldsBase} from '../fields.base/fields.base.component';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
  selector: 'flogo-form-builder-fields-number',
  styleUrls: ['fields.number.css','../fields.base/fields.base.css'],
  moduleId: module.id,
  templateUrl: 'fields.number.tpl.html',
  inputs:['_info:info','_fieldObserver:fieldObserver']
})

export class FlogoFormBuilderFieldsNumber extends FlogoFormBuilderFieldsBase {
  _info:any;
  _fieldObserver:any

  constructor(_translate: TranslateService) {
    super(_translate);
  }

}
