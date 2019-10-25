import { NgModule } from '@angular/core';

import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import { SelectModule } from '@flogo-web/lib-client/select';

import {
  SimulationConfigurationComponent,
  SimulationConfigurationService,
  DragAndDropDirective,
} from './configuration';
import { FileStatusComponent } from './file-status';
import { SimulationControlsComponent } from './simulation-controls';
import { RunStreamComponent } from './run-stream.component';

@NgModule({
  imports: [FlogoSharedModule, SelectModule],
  declarations: [
    RunStreamComponent,
    SimulationConfigurationComponent,
    DragAndDropDirective,
    FileStatusComponent,
    SimulationControlsComponent,
  ],
  providers: [SimulationConfigurationService],
  exports: [RunStreamComponent],
})
export class RunStreamModule {}
