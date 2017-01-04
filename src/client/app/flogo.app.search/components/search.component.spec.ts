import { describe, beforeEach, beforeEachProviders, it, inject, expect, injectAsync} from '@angular/core/testing';
import { FlogoApplicationSearch  } from './search.component';
import { TestComponentBuilder } from '@angular/compiler/testing';
import { TranslateService, TranslateLoader } from 'ng2-translate/ng2-translate';
import { By } from '@angular/platform-browser';
import { IFlogoApplicationModel } from '../../../common/application.model';
import { HTTP_PROVIDERS } from '@angular/http';


describe('FlogoApplicationSearch component', () => {
    let tcb: TestComponentBuilder;

    function createComponent() {
        return tcb.createAsync(FlogoApplicationSearch);
    }

    //setup
    beforeEachProviders(()=> [
        HTTP_PROVIDERS,
        TestComponentBuilder,
        TranslateService,
        TranslateLoader,
        FlogoApplicationSearch
    ]);

    beforeEach(inject([TestComponentBuilder], (_tcb:TestComponentBuilder) => {
        tcb = _tcb;
    }));



    it('On key press should emit the changedSearch event', done => {
        createComponent()
            .then(fixture => {
                let searchComponent = fixture.componentInstance;

                searchComponent.changedSearch.subscribe(() => {
                    done();
                });

                fixture.detectChanges();
                let input = fixture.debugElement.query(By.css('input'));

                let element = input.nativeElement;
                let event = new Event('keyup');
                element.dispatchEvent(event);
            });
    });


});
