import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DiagramModule } from '@flogo-web/lib-client/diagram';
import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import { LogsModule as FlogoLogsModule } from '@flogo-web/lib-client/logs';
import { HeaderModule as FlogoDesignerHeader } from '@flogo-web/lib-client/designer-header';
import { ModalModule } from '@flogo-web/lib-client/modal';
import { MonacoEditorModule } from '@flogo-web/editor';
import { ResourceInterfaceBuilderModule } from '@flogo-web/lib-client/resource-interface-builder';
import { ContextPanelModule } from '@flogo-web/lib-client/context-panel';

import { FormBuilderModule as FlogoCommonFormBuilderModule } from './shared/dynamic-form';
import { FlogoRunFlowComponent } from './run-flow/run-flow.component';

import { CoreModule as FlowCoreModule } from './core';
import { SaveEffects, TriggerMappingsEffects } from './core/effects';

import { TriggersModule as FlogoFlowTriggersModule } from './triggers';
import { TaskMapperModule as FlogoTaskMapperModule } from './task-configurator';
import { BranchMapperModule } from './branch-configurator';
import { ParamsSchemaModule, ParamsSchemaComponent } from './params-schema';
import { FlowRoutingModule } from './flow-routing.module';
import { FlowComponent } from './flow.component';
import { FlowDataResolver } from './flow-data.resolver';
import { featureReducer } from './core/state';
import { FlogoFlowDiagramComponent } from './flow-diagram/flow-diagram.component';
import { FlowTabsComponent } from './flow-tabs/flow-tabs.component';
import { DebugPanelModule } from './debug-panel';
import { TaskAddModule } from './task-add';

@NgModule({
  imports: [
    CommonModule,
    ModalModule,
    ScrollingModule,
    StoreModule.forFeature('flow', featureReducer),
    EffectsModule.forFeature([SaveEffects, TriggerMappingsEffects]),
    FlogoSharedModule,
    FlogoLogsModule,
    DiagramModule,
    ModalModule,
    FlogoDesignerHeader,
    ResourceInterfaceBuilderModule,
    ContextPanelModule,
    MonacoEditorModule,

    FlowCoreModule,
    ParamsSchemaModule,
    FlogoTaskMapperModule,
    FlogoCommonFormBuilderModule,
    FlogoFlowTriggersModule,
    FlowRoutingModule,
    TaskAddModule,
    DebugPanelModule,
    BranchMapperModule,
  ],
  declarations: [
    FlogoRunFlowComponent,
    FlowComponent,
    FlogoFlowDiagramComponent,
    FlowTabsComponent,
  ],
  providers: [FlowDataResolver],
  bootstrap: [FlowComponent],
  entryComponents: [ParamsSchemaComponent],
})
export class FlowModule {}
