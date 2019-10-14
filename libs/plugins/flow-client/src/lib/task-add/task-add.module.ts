import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { TranslateModule } from '@ngx-translate/core';
import { ContribInstallerModule } from '@flogo-web/lib-client/contrib-installer';
import { SubFlowModule, SubFlowComponent } from '../sub-flow';
import { AddActivityDirective } from './add-activity.directive';
import { TaskAddComponent } from './task-add.component';
import { AddActivityService } from './add-activity.service';
import { ActivityListComponent } from './activity-list/activity-list.component';
import { ActivityComponent } from './activity-list/activity.component';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    PortalModule,
    TranslateModule,
    ContribInstallerModule,
    SubFlowModule,
  ],
  declarations: [
    AddActivityDirective,
    TaskAddComponent,
    ActivityComponent,
    ActivityListComponent,
  ],
  providers: [AddActivityService],
  entryComponents: [TaskAddComponent, SubFlowComponent],
  exports: [AddActivityDirective],
})
export class TaskAddModule {}
