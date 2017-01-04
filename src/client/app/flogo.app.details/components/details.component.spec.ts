import { provide } from '@angular/core';
import { describe, beforeEach, beforeEachProviders, it, inject, expect, injectAsync} from '@angular/core/testing';
import { TestComponentBuilder } from '@angular/compiler/testing';
import { TranslateService, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';
import { By } from '@angular/platform-browser';
import { HTTP_PROVIDERS } from '@angular/http';
import { FlogoApplicationDetailsComponent } from './details.component';
import { ROUTER_PROVIDERS } from '@angular/router';
import { RouteParams } from '@angular/router-deprecated';
import { RESTAPIApplicationsService } from '../../../common/services/restapi/applications-api.service';
import { RESTAPIApplicationsServiceMock } from '../../../common/services/restapi/applications-api.service.mock';

describe('FlogoApplicationDetails component', () => {
    let tcb: TestComponentBuilder;

    function createComponent() {
        return tcb.createAsync(FlogoApplicationDetailsComponent);
    }

    //setup
    beforeEachProviders(()=> [
        HTTP_PROVIDERS,
        ROUTER_PROVIDERS,
        TestComponentBuilder,
        TranslateService,
        TranslateLoader,
        provide(RouteParams, { useValue: new RouteParams({ id: '1' }) }),
        provide(RESTAPIApplicationsService, { useClass: RESTAPIApplicationsServiceMock }),
        FlogoApplicationDetailsComponent
    ]);

    beforeEach(inject([TestComponentBuilder], (_tcb:TestComponentBuilder) => {
        tcb = _tcb;
    }));

    it('Should display the name correctly when the binding changes', (done)=> {
        createComponent()
            .then(fixture => {
                let appDetails = fixture.componentInstance;
                appDetails.application.name = 'Sample Application 2';
                fixture.detectChanges();

                let inputName = fixture.debugElement.query(By.css('#appName'));
                expect(inputName.nativeElement.value).toEqual('Sample Application 2');
                done();
            });
    });

    it("If updatedAt field is null,component will init passing the focus to the input name", (done)=> {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                expect(document.activeElement.id).toEqual('appName');
                done();
            })
    });


    it('Should display creation date', (done) => {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                let creation = fixture.debugElement.query(By.css('.created span'));
                expect(creation.nativeElement.innerText).toEqual('a few seconds ago.');
                done();
            });
    });

    it('Click on Add description should show description input field', (done) => {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                let inputDescription;

                // because description field is empty, anchor add description should be present
                let addDescription = fixture.debugElement.query(By.css('.description > a'));
                expect(addDescription).toBeDefined();

                // input description doesn't should be present
                inputDescription = fixture.debugElement.query(By.css('#appDescription'));
                expect(inputDescription).toBeNull();

                addDescription.nativeElement.click();
                fixture.detectChanges();

                // after click on add description, input appDescription should be present
                inputDescription = fixture.debugElement.query(By.css('#appDescription'));
                expect(inputDescription).toBeDefined();
                done();
            })
    });

    it('When description field is empty, Add description link should be visible', (done) => {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                // because description field is empty, anchor add description should be present
                let addDescription = fixture.debugElement.query(By.css('.description > a'));
                expect(addDescription).toBeDefined();
                done();
            });
    });

    it('When done editing description input, description should be visible as a label', (done) => {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                let appDetails = fixture.componentInstance;
                appDetails.application.description = 'A brief description';
                appDetails.editingDescription = false;
                fixture.detectChanges();

                let labelDescription = fixture.debugElement.query(By.css('.descriptionLabel'));
                let labelElement = labelDescription.nativeElement;
                expect(labelElement.innerText).toEqual('Description: A brief description');
                done();
            });
    });


    it('When done editing name input, name should be visible as a label', (done) => {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                let appDetails = fixture.componentInstance;
                appDetails.application.name = 'A cool application';
                appDetails.editingName = false;
                fixture.detectChanges();

                let labelName = fixture.debugElement.query(By.css('.applicationLabel'));
                let labelElement = labelName.nativeElement;
                expect(labelElement.innerText).toEqual('A cool application');
                done();
            });
    });

    it('When description field is not empty, Add description link should not be visible', (done) => {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                let appDetails = fixture.componentInstance;
                appDetails.application.description = 'A brief description';
                fixture.detectChanges();

                // because description field is not empty, anchor add description should not be present
                let addDescription = fixture.debugElement.query(By.css('.description > a'));
                expect(addDescription).toBeNull();
                done();
            });
    });

    it('Should render 3 flows', (done)=> {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                let flows = fixture.debugElement.queryAll(By.css('.flows-container > .flow'));
                expect(flows.length).toEqual(3);
                done();
            });
    });

});


describe('FlogoApplicationDetails component', () => {
    let tcb: TestComponentBuilder;

    function createComponent() {
        return tcb.createAsync(FlogoApplicationDetailsComponent);
    }

    //setup
    beforeEachProviders(()=> [
        HTTP_PROVIDERS,
        ROUTER_PROVIDERS,
        TestComponentBuilder,
        TranslateService,
        TranslateLoader,
        provide(RouteParams, { useValue: new RouteParams({ id: '2' }) }),
        provide(RESTAPIApplicationsService, { useClass: RESTAPIApplicationsServiceMock }),
        FlogoApplicationDetailsComponent
    ]);

    beforeEach(inject([TestComponentBuilder], (_tcb:TestComponentBuilder) => {
        tcb = _tcb;
    }));


    it("If updatedAt field is not null, the name of the component should be shown as a label", (done)=> {
        createComponent()
            .then(fixture => {
                fixture.detectChanges();
                let appDetails = fixture.componentInstance;
                appDetails.application.name = 'Untitled Application';
                fixture.detectChanges();

                let labelName = fixture.debugElement.query(By.css('.applicationLabel'));
                let labelElement = labelName.nativeElement;
                expect(labelElement.innerText).toEqual('Untitled Application');
                done();
            })
    });

});
