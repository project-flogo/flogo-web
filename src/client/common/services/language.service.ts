import { Injectable } from '@angular/core';
import { TranslateService as Ng2TranslateService, TranslateLoader } from 'ng2-translate/ng2-translate';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';


@Injectable()
export class LanguageService {
    DEFAULT_LANGUAGE: string = 'en';

    constructor(private translate: Ng2TranslateService, private http: Http) {
    }

    getUserLanguage() {
        return navigator.language.split('-')[0];
    }

    configureLanguage() {
        var userLang = this.getUserLanguage(); // use navigator lang if available
        userLang = userLang || this.DEFAULT_LANGUAGE;

        // this language will be used as a fallback when a translation isn't found in the current language
        this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);
        this.translate.use(userLang);
    }

}


export class CustomTranslateLoader implements TranslateLoader {
    constructor(private http: Http) {}

    getLanguage(lang: string) {
      return this.http.get(`/i18n/${lang}.json`)
        .map((res: Response)=> res.json())
    }

    public getTranslation(lang: string): Observable<any> {
        return Observable.create(observer => {
            this.getLanguage(lang)
              .subscribe((res: any)=> {
                  observer.next(res);
                  observer.complete();
              });

        });
    }
}
