import {Component} from '@angular/core';
import {Router, NavigationEnd, NavigationCancel} from '@angular/router';
import { Http } from '@angular/http';
import {LoadingStatusService} from '../../../common/services/loading-status.service';

import {Observable} from 'rxjs/Observable';
import { TranslateService } from 'ng2-translate/ng2-translate';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'flogo-app',
  moduleId: module.id,
  templateUrl: 'flogo.tpl.html',
  styleUrls: [ 'flogo.component.css' ]
})

export class FlogoAppComponent {
  DEFAULT_LANGUAGE: string = 'en';

  public isPageLoading : Observable<boolean>;

  constructor(public router : Router,
              public loadingStatusService : LoadingStatusService,
              public translate: TranslateService ,
              public http: Http ){

    this.isPageLoading = this.loadingStatusService.status;

    this.router.events.subscribe((event:any):void => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.loadingStatusService.stop();
      }
    });

    this.configureLanguage();
  }

  getUserLanguage() {
    return navigator.language.split('-')[0];
  }

  configureLanguage() {
    var userLang = this.getUserLanguage(); // use navigator lang if available
    userLang = userLang || this.DEFAULT_LANGUAGE;

    // this language will be used as a fallback when a translation isn't found in the current language
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);

    // Try to load the I18N JSON file for the detected language
    return this.http.get(`/i18n/${userLang}.json`).toPromise()
      .then((app)=>  this.translate.use(userLang) )
      .catch((err)=> this.translate.use(this.DEFAULT_LANGUAGE) );

  }

}
