import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { PortalModule } from '@angular/cdk/portal';
import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import {
  ConfirmationModule
} from '@flogo-web/lib-client/confirmation';
import { ModalModule as FlogoModalModule } from '@flogo-web/lib-client/modal';
import {
  TriggerIconModule
} from '@flogo-web/lib-client/trigger-icon';

import {
  AppDetailService,
  AppResourcesStateService
} from './core';
import { FlogoApplicationComponent } from './app.component';
import { FlogoApplicationDetailComponent } from './app-detail/app-detail.component';
import { FlogoExportFlowsComponent } from './export-flows/export-flows.component';
import { NewResourceComponent } from './new-resource/new-resource.component';
import { TriggerShimBuildComponent } from './shim-trigger/shim-trigger.component';
import { AppRoutingModule } from './app-routing.module';
import {
  MissingTriggerConfirmationComponent
} from './missing-trigger-confirmation';
import {
  ResourceBadgeComponent,
  ResourceComponent,
  ResourceListComponent,
  ResourceViewsSelectorComponent,
  ResourcesGroupByTriggerComponent,
  ResourcesGroupByResourceComponent,
} from './resource-views';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FlogoSharedModule,
    FlogoModalModule,
    OverlayModule,
    RouterModule,
    AppRoutingModule,
    A11yModule,
    PortalModule,
    ScrollingModule,
    ConfirmationModule,
    TriggerIconModule
  ],
  declarations: [
    FlogoApplicationDetailComponent,
    FlogoApplicationComponent,
    ResourceComponent,
    FlogoExportFlowsComponent,
    ResourceViewsSelectorComponent,
    ResourcesGroupByTriggerComponent,
    ResourcesGroupByResourceComponent,
    NewResourceComponent,
    TriggerShimBuildComponent,
    MissingTriggerConfirmationComponent,
    ResourceBadgeComponent,
    ResourceListComponent,
  ],
  providers: [
    AppDetailService,
    AppResourcesStateService
  ],
  entryComponents: [
    FlogoExportFlowsComponent,
    TriggerShimBuildComponent,
    NewResourceComponent,
    MissingTriggerConfirmationComponent,
  ],
  exports: [
    NewResourceComponent
  ],
})
export class FlogoApplicationModule {

}
