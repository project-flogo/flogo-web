import { Component, EventEmitter, OnChanges, SimpleChange } from '@angular/core';
import { FLOGO_INSTALLER_STATUS_INSTALLING } from '../../flogo.installer/constants';
import { TranslateService } from 'ng2-translate/ng2-translate';

let PLACEHOLDER = {
  activity : '',
  trigger : ''
};

@Component( {
  selector : 'flogo-installer-url',
  moduleId : module.id,
  inputs : [ 'installType: flogoInstallType', 'status: flogoInstallerStatus'  ],
  outputs : [ 'onInstallEvent: flogoOnInstall' ],
  templateUrl : 'url-installer.tpl.html',
  styleUrls : [ 'url-installer.component.css' ]
} )
export class FlogoInstallerUrlComponent implements OnChanges {

  installType : string;
  placeholder : string;
  sourceUrl : string;
  onInstallEvent = new EventEmitter();
  disableInstall : boolean;
  status : string;

  constructor(translate: TranslateService) {
    this.disableInstall = false;
    PLACEHOLDER = {
      activity : translate.instant('URL-INSTALLER:ACTIVITY'),
      trigger : translate.instant('URL-INSTALLER:TRIGGER')
    };
  }

  ngOnChanges( changes : {
    [key : string] : SimpleChange
  } ) : any {

    if ( _.has( changes, 'installType' ) ) {
      let currentValue = changes[ 'installType' ].currentValue;

      this.onInstallTypeChange();
    }

    if ( _.has( changes, 'status' ) ) {
      this.onInstallerStatusChange( changes[ 'status' ].currentValue );
    }

  }

  onInstallTypeChange() {
    if ( this.installType === 'trigger' ) {
      this.placeholder = PLACEHOLDER.trigger;
    } else {
      // by default, display the activity placeholder.
      this.placeholder = PLACEHOLDER.activity;
    }
  }

  onSourceUrlChange( newUrl : string ) {
    this.sourceUrl = newUrl;
  }

  onInstallAction( evt : any ) {
    if (!this.disableInstall) {
      this.onInstallEvent.emit( this.sourceUrl );
    }
  }

  onInstallerStatusChange( status: string) {
    if (status === FLOGO_INSTALLER_STATUS_INSTALLING) {
      this.disableInstall = true;
    } else {
      this.disableInstall = false;
    }
  }
}
