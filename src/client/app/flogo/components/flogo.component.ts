import {Component} from '@angular/core';
import {Router, NavigationEnd, NavigationCancel} from '@angular/router';

import {LoadingStatusService} from '../../../common/services/loading-status.service';
import { LanguageService } from '../../../common/services/language.service';
import { Observable } from 'rxjs/Observable';


@Component({
  selector: 'flogo-app',
  moduleId: module.id,
  templateUrl: 'flogo.tpl.html',
  styleUrls: [ 'flogo.component.css' ]
})

export class FlogoAppComponent {

  public isPageLoading : Observable<boolean>;

  constructor(public router : Router,
              public loadingStatusService : LoadingStatusService,
              public languageService: LanguageService){

    this.isPageLoading = this.loadingStatusService.status;

    this.router.events.subscribe((event:any):void => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.loadingStatusService.stop();
      }
    });

    this.languageService.configureLanguage();
  }



}
