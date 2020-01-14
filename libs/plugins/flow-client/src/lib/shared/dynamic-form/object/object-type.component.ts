import { isNil, isString } from 'lodash';
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseField } from '../field-base';

@Component({
  selector: 'flogo-fb-object',
  templateUrl: 'object-type.component.html',
  styleUrls: ['../shared/dynamic-form.less', 'object-type.component.less'],
})
export class ObjectTypeComponent {
  @Input() fieldGroup: FormGroup;
  @Input() fieldControl: BaseField<any>;
  @Input() readonly?: boolean;
  editorOptions = { language: 'json' };

  transformValueIn(value) {
    return isNil(value) || isString(value) ? value : JSON.stringify(value, null, 2);
  }

  transformValueOut(value: string) {
    if (value === '') {
      return undefined;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
}
