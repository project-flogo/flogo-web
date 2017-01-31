import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';
import {TranslateModule, TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';
import {Http} from '@angular/http';

import {FlogoAppListComponent} from './app.list.component';
import {IFlogoApplicationModel} from '../../../common/application.model';
import {FlogoModal} from '../../../common/services/modal.service';
import { RESTAPIApplicationsService } from '../../../common/services/restapi/applications-api.service';
import { RESTAPIApplicationsServiceMock } from '../../../common/services/restapi/applications-api.service.mock';
import { ErrorService } from '../../../common/services/error.service';

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

    ], comp: FlogoAppListComponent, fixture: ComponentFixture<FlogoAppListComponent>,
    de: DebugElement, el: HTMLElement;

  function compileComponent() {
    return TestBed.compileComponents();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http, '/base/dist/public/assets/i18n', '.json'),
        deps: [Http]
      })],
      declarations: [FlogoAppListComponent ], // declare the test component
      providers: [
        {provide: FlogoModal, useClass: FlogoModal},
        {provide: ErrorService, useClass: ErrorService},
        {provide: RESTAPIApplicationsService, useClass: RESTAPIApplicationsServiceMock}
      ]
    });
  });

  it('Should render 3 applications', (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(FlogoAppListComponent);
        comp = fixture.componentInstance;
        comp.applications = applications;

        fixture.detectChanges();
        let res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('ul li'));
        expect(res.length).toEqual(3);
        done();
      });
  });

  it('Should show the application name', (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(FlogoAppListComponent);
        comp = fixture.componentInstance;
        comp.applications = [
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
        let res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('ul li'));
        el = res[0].nativeElement;
        expect(el.innerText.trim()).toEqual('Sample Application');
        done();
      });
  });

  // xit('On add application, should emit the added application to the host', (done) => {
  //   compileComponent()
  //     .then(() => {
  //       fixture = TestBed.createComponent(FlogoAppListComponent);
  //       comp = fixture.componentInstance;
  //       comp.applications = null;
  //       comp.apiApplications.add = () => {
  //         return Promise.resolve({'name': 'Untitled App'});
  //       };
  //       comp.onAddedApp.subscribe((app) => {
  //         expect(app.name).toEqual('Untitled App');
  //         done();
  //       });
  //       comp.onAdd(null);
  //     });
  // });

  it('On selected application, should emit the selected application to the host', done => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(FlogoAppListComponent);
        comp = fixture.componentInstance;
        comp.applications = [
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
        de = fixture.debugElement.query(By.css('ul li'));
        comp.onSelectedApp.subscribe((app) => {
          expect(app.name).toEqual('Sample Application');
          done();
        });

        de.nativeElement.click();
        fixture.detectChanges();
      });
  });

  it('On mouse over must show delete icon', done => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(FlogoAppListComponent);
        comp = fixture.componentInstance;
        comp.applications = [
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
        de = fixture.debugElement.query(By.css('ul li'));

        el = de.nativeElement;
        el.addEventListener('mouseover', () => {
          //fixture.detectChanges();
          let deleteIcon = fixture.debugElement.query(By.css('li span'));

          expect(deleteIcon).not.toBeNull();
          done();
        });

        let event = new Event('mouseover');
        el.dispatchEvent(event);
      });
  });

  it('On delete application, should emit the deleted id application to the host', done => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(FlogoAppListComponent);
        comp = fixture.componentInstance;
        comp.applications = [
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
        comp.flogoModal.confirmDelete = () => {
          return Promise.resolve(true);
        };

        comp.onDeletedApp.subscribe((application: IFlogoApplicationModel) => {
          expect(application.id).toEqual('123');
          done();
        });

        fixture.detectChanges();
        de = fixture.debugElement.query(By.css('ul li'));

        el = de.nativeElement;

        el.addEventListener('mouseover', () => {
          //fixture.detectChanges();
          let deleteIcon = fixture.debugElement.query(By.css('li span'));
          let element = deleteIcon.nativeElement;
          element.click();
        });

        let event = new Event('mouseover');
        el.dispatchEvent(event);
      });
  });
});
