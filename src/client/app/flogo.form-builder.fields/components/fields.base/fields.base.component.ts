import {FLOGO_TASK_ATTRIBUTE_TYPE} from '../../../../common/constants';
import {Component} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
  template: '',
  inputs:['_info:info','_fieldObserver:fieldObserver']
})
export class FlogoFormBuilderFieldsBase{
  _info:any;
  _hasError:boolean = false;
  _errorMessage:string;
  _fieldObserver: any;

  constructor(protected _translate: TranslateService) {
    this._hasError = false;
  }

  onChangeField(event:any) {
    this._info.value = event.target.value;
    this.publishNextChange();
  }

  _getMessage(message:string, properties:any) {
    return _.assign({}, {message: message}, {payload:properties});
  }

  publishNextChange() {
    this._fieldObserver.next(this._getMessage('change-field', this._info));
  }

  isReadOnly() {
    if(this._info.isTrigger) {
      return false;
    }

    return this._info.direction == 'output';
  }

  onValidate(event:any) {
    var value = event.target.value || '';

    if(this._info.required) {
      if(!value.trim()) {
        //this._errorMessage = this._info.title + ' is required';
        this._errorMessage = this._translate.instant('FIELDS-BASE:TITLE-REQUIRED', {value: this._info.title});
        this._hasError = true;
        this._fieldObserver.next(this._getMessage('validation', {status:'error',field: this._info.name}) );
        return;
        // todo
      } else
      this._hasError = false;
      this._fieldObserver.next(this._getMessage('validation', {status:'ok',field: this._info.name}) );
    }

    if(this._info.validation) {
        if(!this._validate(value)) {
          this._hasError = true;
          this._errorMessage = this._info.validationMessage;
          this._fieldObserver.next(this._getMessage('validation', {status:'error',field: this._info.name}));
        } else {
          this._hasError = false;
          this._fieldObserver.next(this._getMessage('validation', {status:'ok',field: this._info.name}));

        }
    }
  }

  _validate(value:string) {
    var re = new RegExp(this._info.validation);
    return re.test(value);
  }


}
