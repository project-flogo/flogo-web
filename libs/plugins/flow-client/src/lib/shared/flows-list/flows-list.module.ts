import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import { FlowsListComponent } from './flows-list.component';
import { FlowsListFlowComponent } from './flow/flows-list-flow.component';

@NgModule({
  imports: [CommonModule, FormsModule, FlogoSharedModule],
  declarations: [FlowsListComponent, FlowsListFlowComponent],
  exports: [FlowsListComponent],
})
export class FlowsListModule {}
