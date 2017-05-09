import { NgModule }       from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';

import { CommonModule as FlogoCommonModule } from '../../common/common.module';
import { FlowsModule as FlogoFlowsModule } from '../flogo.flows/flogo.flows.module';
import { FooterModule as FlogoFooterModule } from '../flogo.footer/flogo.footer.module';

import { FlogoMainComponent } from '../flogo.apps.main/components/main.component';
import { FlogoApplicationContainerComponent } from '../flogo.apps.details/components/container.component';
import { FlogoApplicationComponent } from '../flogo.apps.details/components/application.component';
import { FlogoApplicationFlowsComponent, FlowGroupComponent } from '../flogo.apps.flows/components';
import { FlogoAppListComponent } from '../flogo.apps.list/components/app.list.component';
import { FlogoApplicationSearch } from '../flogo.apps.search/components/search.component';

import { AppDetailService } from './services/apps.service';

import {routing, appRoutingProviders} from './flogo.apps.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    Ng2Bs3ModalModule,
    FlogoFlowsModule,
    FlogoCommonModule,
    FlogoFooterModule,
    routing
  ],
  declarations: [
    FlogoMainComponent,
    FlogoApplicationComponent,
    FlogoApplicationContainerComponent,
    FlogoApplicationFlowsComponent,
    FlowGroupComponent,
    FlogoAppListComponent,
    FlogoApplicationSearch,
  ],
  bootstrap: [FlogoMainComponent],
  providers: [
    appRoutingProviders,
    AppDetailService
  ]
})
export class FlogoAppsModule {}
