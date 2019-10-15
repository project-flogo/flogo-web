import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from '@flogo-web/lib-client/modal';

import { CoreModule as FlowCoreModule } from '@flogo-web/lib-client/core';
import { LanguageModule } from '@flogo-web/lib-client/language';
import { SearchModule } from '@flogo-web/lib-client/search';

import { FlowsListModule } from '../shared/flows-list';
import { SubFlowComponent } from './sub-flow.component';

@NgModule({
  imports: [
    CommonModule,
    ModalModule,
    FlowCoreModule,
    FlowsListModule,
    LanguageModule,
    SearchModule,
  ],
  declarations: [SubFlowComponent],
  exports: [SubFlowComponent],
})
export class SubFlowModule {}
