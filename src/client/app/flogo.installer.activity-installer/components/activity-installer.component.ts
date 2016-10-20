import { Component } from '@angular/core';
import { FlogoInstallerBaseComponent } from '../../flogo.installer.base-installer/components/base-installer.component';
import { RESTAPIActivitiesService } from '../../../common/services/restapi/activities-api.service';
import {TranslateService} from 'ng2-translate/ng2-translate';

import {
  FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS,
  FLOGO_INSTALLER_STATUS_INSTALL_FAILED
} from '../../flogo.installer/constants';

@Component( {
  selector : 'flogo-installer-activity',
  moduleId : module.id,
  templateUrl : 'activity-installer.tpl.html',
  inputs : [ 'query: flogoSearchQuery', 'status: flogoInstallerStatus' ],
  styleUrls : [ 'activity-installer.component.css' ],
} )
export class FlogoInstallerActivityComponent extends FlogoInstallerBaseComponent {

  query : string;
  status : string;
  _categories = <string[]>[];
  _installables = <any[]>[];
  installables = <any[]>[];

  constructor( private _restAPIActivitiesService : RESTAPIActivitiesService, public translate: TranslateService ) {
    super(translate);

    this.init();
  }

  // override
  getInstallables() {
    return this._restAPIActivitiesService.getActivities()
      .then( ( activities ) => {
        return _.map( activities, ( activity : any ) => {
          return {
            name : activity.name,
            title : activity.title,
            description : activity.description,
            version : activity.version,
            where : activity.where,
            icon : activity.icon,
            author : activity.author,
            createTime : activity.createTime || Date.now(),
            updateTime : activity.updateTime || Date.now(),
            isInstalled : activity.installed || false
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
