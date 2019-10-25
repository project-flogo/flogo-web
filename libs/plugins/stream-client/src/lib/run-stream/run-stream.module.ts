import { NgModule } from '@angular/core';

import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';

import {
  SimulationConfigurationComponent,
  SimulationConfigurationService,
  DragAndDropDirective,
} from './configuration';
import { FileStatusComponent } from './file-status';
import { SimulationControlsComponent } from './simulation-controls';
import { RunStreamComponent } from './run-stream.component';

@NgModule({
  imports: [FlogoSharedModule],
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
