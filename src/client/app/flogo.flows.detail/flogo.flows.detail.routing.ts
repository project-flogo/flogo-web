import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigurationLoadedGuard } from '../../common/services/configuration-loaded-guard.service';

import { FlogoFlowsDetail } from './components';
import { FlogoFlowsDetailTriggers } from '../flogo.flows.detail.triggers/components/triggers.component';
import { FlogoFlowsDetailTriggersDetailComponent } from '../flogo.flows.detail.triggers.detail/components/detail.component';
import { FlogoFlowsDetailTasks } from '../flogo.flows.detail.tasks/components/tasks.component';
import { FlogoFlowsDetailTasksDetail } from '../flogo.flows.detail.tasks.detail/components/detail.component';
//import { FlogoLogsComponent } from '../flogo.logs/components/logs.component';
import { FlogoCanvasComponent } from "./components/canvas.component";
import { FlogoFormTriggerHeader } from './../flogo.form.trigger.header/components/form.trigger.header.component';
import { FlogoForm } from './../flogo.form/components/form.component';

export const routes: Routes = [
  {
    path: 'flows/:id',
    component: FlogoCanvasComponent,
    canActivate: [ ConfigurationLoadedGuard ],
    children: [
      {path: '', component: FlogoFlowsDetail},
      {path: 'trigger/add', component: FlogoFlowsDetailTriggers},
      {path: 'trigger/:id', component: FlogoFlowsDetailTriggersDetailComponent},
      {path: 'task/add', component: FlogoFlowsDetailTasks},
      {path: 'task/:id', component: FlogoFlowsDetailTasksDetail} ,
      {path: 'new-trigger', component: FlogoForm }
      //{path: 'logs', component: FlogoLogsComponent}
    ]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);

/*
{path: '/', name: 'FlogoFlowsDetailDefault', component: FlogoFlowsDetail, useAsDefault: true},
{path: '/trigger/add', name: 'FlogoFlowsDetailTriggerAdd', component: FlogoFlowsDetailTriggers},
{path: '/trigger/:id', name: 'FlogoFlowsDetailTriggerDetail', component: FlogoFlowsDetailTriggersDetailComponent},
{path: '/task/add', name: 'FlogoFlowsDetailaskAdd', component: FlogoFlowsDetailTasks},
{path: '/task/:id', name: 'FlogoFlowsDetailTaskDetail', component: FlogoFlowsDetailTasksDetail}*/
