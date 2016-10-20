import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigurationLoadedGuard } from '../../common/services/configuration-loaded-guard.service';

import { FlogoConfigComponent } from './components/config.component';

const routes: Routes = [
  {
    path: '_config',
    canActivate: [ ConfigurationLoadedGuard ],
    component: FlogoConfigComponent
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
