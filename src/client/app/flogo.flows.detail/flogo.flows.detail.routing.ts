import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigurationLoadedGuard } from '../../common/services/configuration-loaded-guard.service';

import { FlogoFlowsDetail } from './components';
import { FlogoFlowsDetailTriggers } from '../flogo.flows.detail.triggers/components/triggers.component';
import { FlogoFlowsDetailTriggersDetail } from '../flogo.flows.detail.triggers.detail/components/detail.component';
import { FlogoFlowsDetailTasks } from '../flogo.flows.detail.tasks/components/tasks.component';
import { FlogoFlowsDetailTasksDetail } from '../flogo.flows.detail.tasks.detail/components/detail.component';
import { FlogoCanvasComponent } from "./components/canvas.component";

const routes: Routes = [
  {
    path: 'flows/:id',
    component: FlogoCanvasComponent,
    canActivate: [ ConfigurationLoadedGuard ],
    children: [
      {path: '', component: FlogoFlowsDetail},
      {path: 'trigger/add', component: FlogoFlowsDetailTriggers},
      {path: 'trigger/:id', component: FlogoFlowsDetailTriggersDetail},
      {path: 'task/add', component: FlogoFlowsDetailTasks},
      {path: 'task/:id', component: FlogoFlowsDetailTasksDetail}
    ]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);

/*
{path: '/', name: 'FlogoFlowsDetailDefault', component: FlogoFlowsDetail, useAsDefault: true},
{path: '/trigger/add', name: 'FlogoFlowsDetailTriggerAdd', component: FlogoFlowsDetailTriggers},
{path: '/trigger/:id', name: 'FlogoFlowsDetailTriggerDetail', component: FlogoFlowsDetailTriggersDetail},
{path: '/task/add', name: 'FlogoFlowsDetailaskAdd', component: FlogoFlowsDetailTasks},
{path: '/task/:id', name: 'FlogoFlowsDetailTaskDetail', component: FlogoFlowsDetailTasksDetail}*/
