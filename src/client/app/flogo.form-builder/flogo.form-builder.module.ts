import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';


import {CommonModule as FlogoCommonModule} from '../../common/common.module';

import {FlogoFormBuilderCommon as FlogoFormBuilderCommonService} from './form-builder.common';

import {
  FlogoFormBuilderFieldsBase,
  FlogoFormBuilderFieldsListBox,
  FlogoFormBuilderFieldsNumber,
  FlogoFormBuilderFieldsObject,
  FlogoFormBuilderFieldsRadio,
  FlogoFormBuilderFieldsTextArea,
  FlogoFormBuilderFieldsTextBox
} from '../flogo.form-builder.fields/fields'

import {FlogoFormBuilderConfigurationTriggerComponent as TriggersDirective} from '../flogo.form-builder.configuration.trigger/components/form-builder.configuration.trigger.component';
import {FlogoFormBuilderConfigurationTaskComponent as TaskDirective} from '../flogo.form-builder.configuration.task/components/form-builder.configuration.task.component';
import {FlogoFormBuilderConfigurationBranchComponent as BranchDirective} from '../flogo.form-builder.configuration.branch/components/form-builder.configuration.branch.component';

import {FlogoFormBuilderComponent} from './components/form-builder.component';

@NgModule({
  imports: [// module dependencies
    NgCommonModule,
    FormsModule,
    FlogoCommonModule
  ],
  declarations: [
    FlogoFormBuilderFieldsBase,
    FlogoFormBuilderFieldsListBox,
    FlogoFormBuilderFieldsNumber,
    FlogoFormBuilderFieldsObject,
    FlogoFormBuilderFieldsRadio,
    FlogoFormBuilderFieldsTextArea,
    FlogoFormBuilderFieldsTextBox,
    TriggersDirective,
    TaskDirective,
    BranchDirective,
    FlogoFormBuilderComponent
  ],
  exports: [
    FlogoFormBuilderComponent
  ],
  providers: [
    FlogoFormBuilderCommonService
  ]
})
export class FormBuilderModule {
}
