import { NgModule } from '@angular/core';

import {RESTAPIService} from './services/rest-api.service';
import {RESTAPIApplicationsService} from './services/restapi/applications-api.service';
import {RESTAPIActivitiesService} from './services/restapi/activities-api.service';
import {RESTAPIConfigurationService} from './services/restapi/configuration-api-service';
import {RESTAPIFlowsService} from './services/restapi/flows-api.service';
import {RESTAPITriggersService} from './services/restapi/triggers-api.service';
import {FlogoModal} from './services/modal.service';
import {ConfigurationService} from './services/configuration.service';
import {PostService} from './services/post.service';
import {ConfigurationLoadedGuard} from './services/configuration-loaded-guard.service';
import {LoadingStatusService} from './services/loading-status.service';
import {LogService} from './services/log.service';
import {ErrorService} from './services/error.service';

@NgModule({
  providers: [ // services
    RESTAPIService,
    RESTAPIApplicationsService,
    RESTAPIActivitiesService,
    RESTAPIConfigurationService,
    RESTAPIFlowsService,
    RESTAPITriggersService,
    FlogoModal,
    ConfigurationService,
    PostService,
    ConfigurationLoadedGuard,
    LoadingStatusService,
    LogService,
    ErrorService
  ]
})
export class CoreModule { }
