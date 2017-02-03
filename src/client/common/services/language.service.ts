import { Injectable } from '@angular/core';
import { TranslateService as Ng2TranslateService, TranslateLoader } from 'ng2-translate/ng2-translate';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


@Injectable()
export class LanguageService {
    DEFAULT_LANGUAGE: string = 'en';

    constructor(private translate: Ng2TranslateService) {
    }

    configureLanguage() {
        // this language will be used as a fallback when a translation isn't found in the current language
        this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);

        // use navigator lang if available
        let userLang = this.translate.getBrowserLang();
        if (userLang && userLang != this.DEFAULT_LANGUAGE) {
          this.translate.use(userLang);
        }

    }

}


export class CustomTranslateLoader implements TranslateLoader {
    constructor(private http: Http) {}

    public getTranslation(lang: string): Observable<any> {
        return this.http.get(`/i18n/${lang}.json`)
          .map((res: Response)=> res.json())
          .catch((err: any) => {
            console.warn(`Could not load translations for language "${lang}"`);
            return Observable.of({});
          });
    }
}
