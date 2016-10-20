import { Component, EventEmitter } from '@angular/core';
import { FlogoInstallerComponent } from '../../flogo.installer/components/installer.component';

@Component( {
  selector : 'flogo-flows-detail-tasks-install',
  outputs : [ 'onInstalled: flogoOnInstalled' ],
  moduleId : module.id,
  templateUrl : 'install.tpl.html',
} )
export class FlogoFlowsDetailTasksInstallComponent {

  public activities : any[] = [];
  public isActivated = false;
  onInstalled = new EventEmitter();

  constructor() {
    this.isActivated = false;
  }

  public openModal() {
    this.isActivated = true;
  }

  public onInstalledAction( response : any ) {
    // bubble the event.
    this.onInstalled.emit( response );
  }
}
