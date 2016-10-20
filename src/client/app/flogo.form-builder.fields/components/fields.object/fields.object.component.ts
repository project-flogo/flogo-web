import {Component} from '@angular/core';
import {FlogoFormBuilderFieldsBase} from '../fields.base/fields.base.component';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
  selector: 'flogo-form-builder-fields-object',
  styleUrls: ['fields.object.css','../fields.base/fields.base.css'],
  moduleId: module.id,
  templateUrl: 'fields.object.tpl.html',
  inputs:['_info:info','_fieldObserver:fieldObserver']
})

export class FlogoFormBuilderFieldsObject  extends FlogoFormBuilderFieldsBase {
  _info:any;
  _fieldObserver:any;
  _value:string;


  constructor(_translate: TranslateService) {
    super(_translate);
  }


  ngOnInit() {
    // primitive values could be assigned directly instead of using JSON.stringify, for avoiding the extra " marks
    // also ensure the value is in string format
    // And object field can store xml, json, different formats
    // first we try to map to string
    if ( _.isNumber( this._info.value ) || _.isString( this._info.value ) || _.isBoolean( this._info.value ) ) {
      this._value = '' + this._info.value;
      return;
    }

    if ( this._info.value ) {
      try {
        this._value = '' + JSON.stringify( this._info.value );
      } catch(err) { }

    }

  }

}
