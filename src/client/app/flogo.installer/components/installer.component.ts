import { Component, EventEmitter, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { RESTAPITriggersService } from '../../../common/services/restapi/triggers-api.service';
import { RESTAPIActivitiesService } from '../../../common/services/restapi/activities-api.service';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { notification } from '../../../common/utils';
import {
  FLOGO_INSTALLER_STATUS_STANDBY, FLOGO_INSTALLER_STATUS_IDLE,
  FLOGO_INSTALLER_STATUS_INSTALL_FAILED, FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS, FLOGO_INSTALLER_STATUS_INSTALLING
} from '../constants';

let ACTIVITY_TITLE = '';
let TRIGGER_TITLE = '';

@Component( {
  selector : 'flogo-installer',
  moduleId : module.id,
  templateUrl : 'installer.tpl.html',
  inputs : [ 'installType: flogoInstallType', 'isActivated: flogoIsActivated' ],
  outputs : [
    'installTypeUpdate: flogoInstallTypeChange',
    'isActivatedUpdate: flogoIsActivatedChange',
    'onInstalled: flogoOnInstalled'
  ],
  styleUrls : [ 'installer.component.css' ]
} )
export class FlogoInstallerComponent implements OnChanges {

  @ViewChild( 'installerModal' ) modal : ModalComponent;

  installType : string;
  _installType : string;

  isActivated : boolean;
  _isActivated : boolean;
  isActivatedUpdate = new EventEmitter();
  onInstalled = new EventEmitter();

  query = '';
  _title = '';

  _status = FLOGO_INSTALLER_STATUS_IDLE;

  // TODO
  //  may add two-way binding later.
  installTypeUpdate = new EventEmitter();

  constructor(
    private _triggersAPIs : RESTAPITriggersService,
    private _activitiesAPIs : RESTAPIActivitiesService,
    private _translate : TranslateService) {
    ACTIVITY_TITLE = _translate.instant('INSTALLER:DOWNLOAD-TILES');
    TRIGGER_TITLE = _translate.instant('INSTALLER:DOWNLOAD-TRIGGERS');
    this.init();
  }

  init() {
    console.log( 'Initialise Flogo Installer Component.' );

    this._status = FLOGO_INSTALLER_STATUS_STANDBY;
  }

  ngOnChanges( changes : {
    [key : string] : SimpleChange
  } ) {

    if ( _.has( changes, 'installType' ) ) {
      this.onInstallTypeChange( changes[ 'installType' ].currentValue );
    }

    if ( _.has( changes, 'isActivated' ) ) {
      this.onActivatedStatusChange( changes[ 'isActivated' ].currentValue );
    }

  }

  onInstallTypeChange( newVal ) {
    this._installType = newVal;

    switch ( this._installType ) {
      case 'activity':
        this._title = ACTIVITY_TITLE;
        break;
      case 'trigger':
        this._title = TRIGGER_TITLE;
        break;
      default:
        this._title = 'Install';
        break;
    }
  }

  onActivatedStatusChange( newVal ) {

    console.log( `Changed in FlogoInstallerComponent: ${newVal}` );

    if ( newVal !== this._isActivated ) {

      console.log( `Assigned.` );
      this._isActivated = newVal;

      if ( this._isActivated ) {
        this.openModal();
      }
    }
  }

  openModal(event? : any) {
    console.log( 'Open Modal.' );
    this._status = FLOGO_INSTALLER_STATUS_STANDBY;
    this.modal.open();
  }

  closeModal(event? : any) {
    console.log( 'Close Modal.' );
    this.modal.close();
  }

  onModalCloseOrDismiss(event? : any) {
    console.log( 'On Modal Close.' );
    this._isActivated = false;
    this._status = FLOGO_INSTALLER_STATUS_IDLE;
    this.isActivatedUpdate.emit( false );
  }

  onInstallAction( url : string ) {
    console.group( `[FlogoInstallerComponent] onInstallAction` );
    console.log( `Source URL: ${url} ` );

    let installAPI = null;

    if ( this._installType === 'trigger' ) {
      installAPI = this._triggersAPIs.installTriggers.bind( this._triggersAPIs );
    } else if ( this._installType === 'activity' ) {
      installAPI = this._activitiesAPIs.installActivities.bind( this._activitiesAPIs );
    } else {
      console.warn( 'Unknown installation type.' );
      console.groupEnd();
      return;
    }

    let self = this;

    if ( _.isFunction( installAPI ) ) {

      self._status = FLOGO_INSTALLER_STATUS_INSTALLING;

      installAPI( [ url ] )
        .then( ( response )=> {
          console.group( `[FlogoInstallerComponent] onResponse` );
          if ( response.fail.length ) {
            let parameters = `${_.capitalize( self._installType )}`;
            let message = this._translate.instant('INSTALLER:ERROR-MESSAGE-INSTALLATION', {value:parameters});
            notification(message, 'error' );
            //notification( `${_.capitalize( self._installType )} installation failed.`, 'error' );
            //console.error( `${_.capitalize( self._installType )} [ ${url} ] installation failed.` );
          } else {
            let parameters = `${_.capitalize( self._installType )}`;
            let message = this._translate.instant('INSTALLER:SUCCESS-MESSAGE-INSTALLATION', {value:parameters});
            notification( message, 'success', 3000 );
            //notification( `${_.capitalize( self._installType )} installed.`, 'success', 3000 );
            //console.log( `${_.capitalize( self._installType )} [ ${url} ] installed.` );
          }
          console.groupEnd();
          return response;
        } )
        .then( ( response ) => {
          this.onInstalled.emit( response );
          self._status = FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS;
          console.groupEnd();
          return response;
        } )
        .catch( ( err ) => {
          console.error( err );
          let parameters = `${_.capitalize( self._installType )}`;
          let message = this._translate.instant('INSTALLER:ERROR-MESSAGE-INSTALLATION', {value:parameters});
          notification(message, 'error' );
          self._status = FLOGO_INSTALLER_STATUS_INSTALL_FAILED;
          console.groupEnd();
        } );
    } else {
      self._status = FLOGO_INSTALLER_STATUS_INSTALL_FAILED;
    }

  }
}
