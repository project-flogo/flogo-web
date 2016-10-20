import { Component, EventEmitter } from '@angular/core';

@Component( {
  selector : 'flogo-flows-detail-triggers-install',
  outputs : [ 'onInstalled: flogoOnInstalled' ],
  moduleId : module.id,
  templateUrl : 'install.tpl.html'
} )
export class FlogoFlowsDetailTriggersInstallComponent {

  public triggers : any[] = [];
  isActivated = false;
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
