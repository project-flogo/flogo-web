import { describe, beforeEach, beforeEachProviders, it, inject, expect, injectAsync} from '@angular/core/testing';
import { FlogoAppListComponent } from './app.list.component';
import { TestComponentBuilder } from '@angular/compiler/testing';
import { TranslateService, TranslateLoader } from 'ng2-translate/ng2-translate';
import { By } from '@angular/platform-browser';
import {FlogoModal} from '../../../common/services/modal.service';
import { IFlogoApplicationModel } from '../../../common/application.model';
import { HTTP_PROVIDERS } from '@angular/http';


describe('FlogoAppList component', () => {
    let applications = [
        {
            id: "1",
            name: "Sample Application 1",
            version: "0.0.1",
            description: "My App",
            createdAt: "2016-12-16T00:24:26+00:00",
            updatedAt: "2016-12-16T00:24:26+00:00"
        },
        {
            id: "2",
            name: "Sample Application 2",
            version: "0.0.1",
            description: "My App",
            createdAt: "2016-12-16T00:24:26+00:00",
            updatedAt: "2016-12-16T00:24:26+00:00"
        },
        {
            id: "3",
            name: "Sample Application 3",
            version: "0.0.1",
            description: "My App",
            createdAt: "2016-12-16T00:24:26+00:00",
            updatedAt: "2016-12-16T00:24:26+00:00"
        }

    ];
    let tcb: TestComponentBuilder;

    function createComponent() {
        return tcb.createAsync(FlogoAppListComponent);
    }

    //setup
    beforeEachProviders(()=> [
        HTTP_PROVIDERS,
        TestComponentBuilder,
        TranslateService,
        TranslateLoader,
        FlogoModal,
        FlogoAppListComponent
    ]);

    beforeEach(inject([TestComponentBuilder], (_tcb:TestComponentBuilder) => {
        tcb = _tcb;
    }));

    it('Should render 3 applications', (done)=> {
         createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = applications;

               fixture.detectChanges();
               let listItems = fixture.debugElement.queryAll(By.css('ul li'));
                expect(listItems.length).toEqual(3);
                done();
            });
    });

    it('Should show the application name', (done)=> {
        createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = [
                    {
                        id: "123",
                        name: "Sample Application",
                        version: "0.0.1",
                        description: "My App",
                        createdAt: "2016-12-16T00:24:26+00:00",
                        updatedAt: "2016-12-16T00:24:26+00:00"
                    }
                ];

                fixture.detectChanges();
                let listItems = fixture.debugElement.queryAll(By.css('ul li'));
                expect(listItems[0].nativeElement.innerText.trim()).toEqual('Sample Application');
                done();
            });
    });


    it('Should add an application', (done)=> {
        createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = [];
                appList.add();
                expect(appList.applications.length).toEqual(1);
                done();
            });
    });

    it('Should generate correct application name', (done)=> {
        createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = [
                    {
                        id: "123",
                        name: "Untitled App",
                        version: "0.0.1",
                        description: "My App",
                        createdAt: "2016-12-16T00:24:26+00:00",
                        updatedAt: "2016-12-16T00:24:26+00:00"
                    }
                ];
                appList.add();
                expect(appList.applications[0].name).toEqual('Untitled App (1)');
                done();
            });
    });

    it('On add application, should emit the added application to the host', (done)=> {
        createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = [''];

                appList.onAddedApp.subscribe((app)=> {
                    expect(app.name).toEqual('Untitled App');
                    done();
                });

                appList.add();
            });
    });

    it('On selected application, should emit the selected application to the host', done=> {
        createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = [
                    {
                        id: "123",
                        name: "Sample Application",
                        version: "0.0.1",
                        description: "My App",
                        createdAt: "2016-12-16T00:24:26+00:00",
                        updatedAt: "2016-12-16T00:24:26+00:00"
                    }
                ];

                fixture.detectChanges();
                let listItems = fixture.debugElement.query(By.css('ul li'));
                appList.onSelectedApp.subscribe((app)=> {
                    expect(app.name).toEqual('Sample Application');
                    done();
                });

                listItems.nativeElement.click();
                fixture.detectChanges();
            });
    });

    it('On mouse over must show delete icon', done => {
        createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = [
                    {
                        id: "123",
                        name: "Sample Application",
                        version: "0.0.1",
                        description: "My App",
                        createdAt: "2016-12-16T00:24:26+00:00",
                        updatedAt: "2016-12-16T00:24:26+00:00"
                    }
                ];

                fixture.detectChanges();
                let listItem = fixture.debugElement.query(By.css('ul li'));

                let element = listItem.nativeElement;
                element.addEventListener('mouseover', (a) => {
                    //fixture.detectChanges();
                    let deleteIcon = fixture.debugElement.query(By.css('li span'));

                    expect(deleteIcon).not.toBeNull();
                    done();
                });

                let event = new Event('mouseover');
                element.dispatchEvent(event);
            });
    });

    it('On delete application, should emit the deleted application to the host', done => {
        createComponent()
            .then(fixture => {
                let appList = fixture.componentInstance;
                appList.applications = [
                    {
                        id: "123",
                        name: "A cool application",
                        version: "0.0.1",
                        description: "My App",
                        createdAt: "2016-12-16T00:24:26+00:00",
                        updatedAt: "2016-12-16T00:24:26+00:00"
                    }
                ];

                // mock confirmDelete
                appList.flogoModal.confirmDelete =  (message) => {
                    return Promise.resolve(true);
                };

                appList.onDeletedApp.subscribe((app) => {
                    expect(app.name).toEqual('A cool application');
                    done();
                });

                fixture.detectChanges();
                let listItem = fixture.debugElement.query(By.css('ul li'));

                let element = listItem.nativeElement;

                element.addEventListener('mouseover', (a) => {
                    //fixture.detectChanges();
                    let deleteIcon = fixture.debugElement.query(By.css('li span'));
                    let element = deleteIcon.nativeElement;
                    element.click();
                });

                let event = new Event('mouseover');
                element.dispatchEvent(event);
            });
    });


});
