import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {Ng2Bs3ModalModule} from 'ng2-bs3-modal/ng2-bs3-modal';

import { InstructionsModule as FlogoInstructionsModule } from '../flogo.instructions/flogo.instructions.module';
import { CommonModule as FlogoCommonModule } from '../../common/common.module'
import { FlogoExportFlowsComponent } from '../flogo.apps.details/components/export-flow.component';
import { FlogoFlowsAddComponent as FlogoFlowsAddComponent } from '../flogo.flows.add/components/add.component';
import { FlogoFlowsImport as FlogoFlowsImportComponent } from '../flogo.flows.import/components/import-flow.component';
import { FlogoFlowsFlowNameComponent } from '../flogo.flows.flow-name/components/flow-name.component';
import { FooterModule as FlogoFooterModule } from '../flogo.footer/flogo.footer.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    Ng2Bs3ModalModule,
    FlogoInstructionsModule,
    FlogoCommonModule,
    FlogoFooterModule
  ],
  declarations: [
    FlogoFlowsAddComponent,
    FlogoFlowsImportComponent,
    FlogoFlowsFlowNameComponent,
  ],
  exports: [
    FlogoFlowsAddComponent,
    FlogoFlowsImportComponent,
    FlogoFlowsFlowNameComponent,
  ]
})
export class FlowsModule {}
