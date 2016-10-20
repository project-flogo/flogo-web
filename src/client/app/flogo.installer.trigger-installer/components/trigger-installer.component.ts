import { Component } from '@angular/core';
import { FlogoInstallerBaseComponent } from '../../flogo.installer.base-installer/components/base-installer.component';
import { RESTAPITriggersService } from '../../../common/services/restapi/triggers-api.service';
import { TranslateService } from 'ng2-translate/ng2-translate';

import {
  FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS,
  FLOGO_INSTALLER_STATUS_INSTALL_FAILED
} from '../../flogo.installer/constants';

@Component( {
  selector : 'flogo-installer-trigger',
  moduleId : module.id,
  templateUrl : 'trigger-installer.tpl.html',
  inputs : [ 'query: flogoSearchQuery', 'status: flogoInstallerStatus' ],
  styleUrls : [ 'trigger-installer.component.css' ]
} )
export class FlogoInstallerTriggerComponent extends FlogoInstallerBaseComponent {

  query : string;
  status : string;
  _categories = <string[]>[];
  _installables = <any[]>[];
  installables = <any[]>[];

  constructor( private _restAPITriggersService : RESTAPITriggersService,
              public translate: TranslateService) {
    super(translate);

    this.init();
  }

  // override
  getInstallables() {
    return this._restAPITriggersService.getTriggers()
      .then( ( triggers ) => {
        return _.map( triggers, ( trigger : any ) => {
          return {
            name : trigger.name,
            title : trigger.title,
            description : trigger.description,
            version : trigger.version,
            where : trigger.where,
            icon : trigger.icon,
            author : trigger.author,
            createTime : trigger.createTime || Date.now(),
            updateTime : trigger.updateTime || Date.now(),
            isInstalled : trigger.installed || false
          }
        } );
      } );
  }

  // override
  onInstallerStatusChange( status: string) {
    if (status === FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS || status === FLOGO_INSTALLER_STATUS_INSTALL_FAILED) {
      this.updateData();
    }
  }
}
