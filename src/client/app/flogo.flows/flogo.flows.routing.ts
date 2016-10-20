import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigurationLoadedGuard } from '../../common/services/configuration-loaded-guard.service';

import { FlogoFlowsComponent } from './components/flows.component';

const routes: Routes = [
  {
    canActivate: [ ConfigurationLoadedGuard ],
    path: 'flows',
    component: FlogoFlowsComponent
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
