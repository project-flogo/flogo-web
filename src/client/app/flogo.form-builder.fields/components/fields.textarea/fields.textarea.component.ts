import {Component, SimpleChange} from '@angular/core';
import {ROUTER_DIRECTIVES} from '@angular/router-deprecated';
import {FlogoFormBuilderFieldsBase} from '../fields.base/fields.base.component';

@Component({
  selector: 'flogo-form-builder-fields-textarea',
  styleUrls: ['fields.textarea.css', '../fields.base/fields.base.css'],
  moduleId: module.id,
  templateUrl: 'fields.textarea.tpl.html',
  directives: [ROUTER_DIRECTIVES],
  inputs:['_info:info','_fieldObserver:fieldObserver']
})

export class FlogoFormBuilderFieldsTextArea  extends FlogoFormBuilderFieldsBase {
  _info:any;
  _fieldObserver:any;
  _value:any;

  constructor() {
    super();
  }

  onChangeField(event:any){
    let value : any = null;
    try {
      value = JSON.parse(event.target.value);
    } catch(e) {
      // invalid json
      // TODO
      //  better handler of invalid JSON?
      //  for the moment, keep the value even though it's not valid JSON, and ensure string format
      value = '' + event.target.value;
    }
    this._info.value = value;
    this.publishNextChange();
  }

  ngOnInit() {

    // primitive values could be assigned directly instead of using JSON.stringify, for avoiding the extra " marks
    // also ensure the value is in string format
    if ( _.isNumber( this._info.value ) || _.isString( this._info.value ) || _.isBoolean( this._info.value ) ) {
      this._value = '' + this._info.value;
    } else if ( this._info.value ) {
      this._value = JSON.stringify( this._info.value );
    }

  }

}
