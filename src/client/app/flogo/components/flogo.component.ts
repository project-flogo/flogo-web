import {Component} from '@angular/core';
import {Router, NavigationEnd, NavigationCancel} from '@angular/router';
import {LoadingStatusService} from '../../../common/services/loading-status.service';

import {Observable} from 'rxjs/Observable';
import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
  selector: 'flogo-app',
  moduleId: module.id,
  templateUrl: 'flogo.tpl.html',
  styleUrls: [ 'flogo.component.css' ]
})

export class FlogoAppComponent {

  public isPageLoading : Observable<boolean>;

  constructor(private router : Router, private loadingStatusService : LoadingStatusService, translate: TranslateService){
    this.isPageLoading = this.loadingStatusService.status;

    this.router.events.subscribe((event:any):void => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.loadingStatusService.stop();
      }
    });

    var userLang = navigator.language.split('-')[0]; // use navigator lang if available
    userLang = /(fr|en)/gi.test(userLang) ? userLang : 'en';

    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use(userLang);
  }
}
