import {Component} from '@angular/core';
import {FlogoFormBuilderFieldsBase} from '../fields.base/fields.base.component';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
  selector: 'flogo-form-builder-fields-textarea',
  styleUrls: ['fields.textarea.css', '../fields.base/fields.base.css'],
  moduleId: module.id,
  templateUrl: 'fields.textarea.tpl.html',
  inputs:['_info:info','_fieldObserver:fieldObserver']
})

export class FlogoFormBuilderFieldsTextArea  extends FlogoFormBuilderFieldsBase {
  _info:any;
  _fieldObserver:any;
  _value:any;

  constructor(_translate:TranslateService) {
    super(_translate);
  }

  onChangeField(event:any){
    let invalidJSON = false;
    let value : any = null;
    try {
      value = JSON.parse(event.target.value);
    } catch(e) {
      // invalid json
      // TODO
      //  better handler of invalid JSON?
      //  for the moment, keep the value even though it's not valid JSON, and ensure string format
      this._errorMessage = this._translate.instant('FIELDS-TEXTAREA:INVALID-JSON',{value:this._info.title});
      this._hasError = true;
      invalidJSON = true;
      this._fieldObserver.next(this._getMessage('validation', {status:'error',field: this._info.name}) );

      value = '' + event.target.value;
    }
    if(!invalidJSON) {
      this._hasError = false;
      this._fieldObserver.next(this._getMessage('validation', {status:'ok',field: this._info.name}) );
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
