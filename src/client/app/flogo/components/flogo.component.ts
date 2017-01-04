import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, RouteConfig} from '@angular/router-deprecated';
import {FlogoNavbarComponent} from './navbar.component';
import {FlogoFlowsComponet} from '../../flogo.flows/components/flows.component';
import {FlogoCanvasComponent} from '../../flogo.flows.detail/components/canvas.component';
import {FlogoFormBuilderComponent} from "../../flogo.form-builder/components/form-builder.component";
import {PostService} from '../../../common/services/post.service';
import { RESTAPIService } from '../../../common/services/rest-api.service';
import { HTTP_PROVIDERS } from '@angular/http';
import { RESTAPITest } from '../../../common/services/rest-api-test.spec';
import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import { RESTAPIActivitiesService } from '../../../common/services/restapi/activities-api.service';
import { RESTAPITriggersService } from '../../../common/services/restapi/triggers-api.service';
import { FlogoConfigComponent } from '../../flogo.config/components/config.component';
import { RESTAPIConfigurationService } from '../../../common/services/restapi/configuration-api-service';
import { ConfigurationService } from '../../../common/services/configuration.service';
import { LogService } from '../../../common/services/log.service';
import { formatServerConfiguration, getFlogoGlobalConfig } from '../../../common/utils';
import { TranslateService, TranslatePipe } from 'ng2-translate/ng2-translate';
import { FlogoHomeComponent } from '../../flogo.home/components/home.component';
//import { FlogoApplicationDetailsComponent } from '../../flogo.app.details/components/details.component';
import { RESTAPIApplicationsService } from '../../../common/services/restapi/applications-api.service';

@Component({
  selector: 'flogo-app',
  moduleId: module.id,
  templateUrl: 'flogo.tpl.html',
  styleUrls: [ 'flogo.component.css' ],
  directives: [ROUTER_DIRECTIVES, FlogoNavbarComponent],
  pipes: [TranslatePipe],
  providers: [PostService, RESTAPIService, RESTAPIFlowsService, RESTAPIActivitiesService,
              RESTAPITriggersService, HTTP_PROVIDERS, RESTAPIConfigurationService,
              ConfigurationService, LogService, RESTAPIActivitiesService, RESTAPIApplicationsService]
})

@RouteConfig([
  {
    path: '/', name: "FlogoHome", component:FlogoFlowsComponet
  },
  {
    path: '/flows', name: "FlogoFlows", component:FlogoFlowsComponet, useAsDefault: true
  },
  {
    path:'/flows/:id/...', name:"FlogoFlowDetail", component: FlogoCanvasComponent
  },
  {
    path:'/task', name: 'FlogoTask', component: FlogoFormBuilderComponent
  },
  {
    path:'/rest-api-test', name: 'FlogoRESTAPITest', component: RESTAPITest
  },
  // TODO
  //  temp config page to change server URL settings
  {
    path: '/_config', name: "FlogoDevConfig", component:FlogoConfigComponent
  },
  {
    path: '/home/...', name: 'FlogoHomeComponent', component: FlogoHomeComponent
  }
])

export class FlogoAppComponent {
  constructor(translate: TranslateService){
    var userLang = navigator.language.split('-')[0]; // use navigator lang if available
    userLang = /(fr|en)/gi.test(userLang) ? userLang : 'en';

    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use(userLang);
  }
}
