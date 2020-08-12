import { NgModule } from '@angular/core';
import {RouterModule,
  Routes} from '@angular/router';
import {
  FlogoApplicationComponent
} from './app.component';

let appRoutes:Routes = [{
    path: ':appId',
    component: FlogoApplicationComponent,
  }, {
    path: '**',
    redirectTo: '/', pathMatch:'full',
  }]

@NgModule(
  {
  imports: [
    RouterModule.forChild(appRoutes)
  ],
  exports: [
    RouterModule
  ],
}
)
export class AppRoutingModule{}
