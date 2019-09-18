import { NgModule } from '@angular/core';

import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';

import { RunStreamComponent } from './run-stream.component';
import { RunStreamButtonComponent } from './run-stream-button/run-stream-button.component';
import { DragAndDropDirective } from './drag-and-drop.directive/drag-and-drop.directive';
import { FileStatusComponent } from '../file-status/file-status.component';

@NgModule({
  imports: [FlogoSharedModule],
  declarations: [
    RunStreamButtonComponent,
    RunStreamComponent,
    DragAndDropDirective,
    FileStatusComponent,
  ],
  exports: [RunStreamButtonComponent],
})
export class RunStreamModule {}