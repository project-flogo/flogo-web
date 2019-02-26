import { BsModalComponent } from 'ng2-bs3-modal';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  ErrorService,
  AppsApiService,
  HttpUtilsService,
} from '@flogo-web/client-core/services';
import { NotificationsService } from '@flogo-web/client-core/notifications';
import { NotificationsServiceMock } from '@flogo-web/client-core/notifications/testing';
import { FakeRootLanguageModule } from '@flogo-web/client-core/language/testing';
import { AppsApiServiceMock } from '@flogo-web/client-core/services/restapi/v2/apps-api.service.mock';
import { TimeFromNowPipe, FlogoDeletePopupComponent } from '@flogo-web/client-shared';

import { FlogoAppImportComponent } from '../app-import/app-import.component';
import { FlogoAppsListComponent } from './apps-list.component';

describe('FlogoAppList component', () => {
  const applications = [
    {
      id: '1',
      name: 'Sample Application 1',
      version: '0.0.1',
      description: 'My App',
      createdAt: '2016-12-16T00:24:26+00:00',
      updatedAt: '2016-12-16T00:24:26+00:00',
      type: 'flogo:app',
    },
    {
      id: '2',
      name: 'Sample Application 2',
      version: '0.0.1',
      description: 'My App',
      createdAt: '2016-12-16T00:24:26+00:00',
      updatedAt: '2016-12-16T00:24:26+00:00',
      type: 'flogo:app',
    },
    {
      id: '3',
      name: 'Sample Application 3',
      version: '0.0.1',
      description: 'My App',
      createdAt: '2016-12-16T00:24:26+00:00',
      updatedAt: '2016-12-16T00:24:26+00:00',
      type: 'flogo:app',
    },
  ];
  let comp: FlogoAppsListComponent;
  let fixture: ComponentFixture<FlogoAppsListComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        // // TODO:  HttpModule shouldn't be required
        // HttpModule,
        // NoDependenciesFakeLanguageModule,
        FakeRootLanguageModule,
      ],
      declarations: [
        FlogoAppsListComponent,
        FlogoDeletePopupComponent,
        TimeFromNowPipe,
        FlogoAppImportComponent,
        BsModalComponent,
      ], // declare the test component
      providers: [
        HttpUtilsService,
        { provide: ErrorService, useClass: ErrorService },
        { provide: AppsApiService, useClass: AppsApiServiceMock },
        {
          provide: NotificationsService,
          useValue: new NotificationsServiceMock(),
        },
      ],
    });
    return TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlogoAppsListComponent);
    comp = fixture.componentInstance;
  });

  it('Should render 3 applications', () => {
    comp.applications = applications;
    fixture.detectChanges();
    const res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.qa-app'));
    expect(res.length).toEqual(3);
  });

  it('Should show the application name', () => {
    comp.applications = [
      {
        id: '123',
        name: 'Sample Application',
        version: '0.0.1',
        description: 'My App',
        createdAt: '2016-12-16T00:24:26+00:00',
        updatedAt: '2016-12-16T00:24:26+00:00',
        type: 'flogo:app',
      },
    ];
    fixture.detectChanges();
    const res: Array<DebugElement> = fixture.debugElement.queryAll(
      By.css('.qa-app-name')
    );
    el = res[0].nativeElement;
    expect(el.innerText.trim()).toEqual('Sample Application');
  });

  it('On selected application, should emit the selected application to the host', done => {
    comp.applications = [
      {
        id: '123',
        name: 'Sample Application',
        version: '0.0.1',
        description: 'My App',
        createdAt: '2016-12-16T00:24:26+00:00',
        updatedAt: '2016-12-16T00:24:26+00:00',
        type: 'flogo:app',
      },
    ];

    fixture.detectChanges();
    de = fixture.debugElement.query(By.css('.qa-app-name'));
    comp.appSelected.subscribe(app => {
      expect(app.name).toEqual('Sample Application');
      done();
    });

    de.nativeElement.click();
    fixture.detectChanges();
  });

  it('On mouse over must show delete icon', done => {
    comp.applications = [
      {
        id: '123',
        name: 'Sample Application',
        version: '0.0.1',
        description: 'My App',
        createdAt: '2016-12-16T00:24:26+00:00',
        updatedAt: '2016-12-16T00:24:26+00:00',
        type: 'flogo:app',
      },
    ];

    fixture.detectChanges();
    de = fixture.debugElement.query(By.css('.qa-app'));

    el = de.nativeElement;
    el.addEventListener('mouseover', () => {
      // fixture.detectChanges();
      const deleteIcon = fixture.debugElement.query(By.css('.qa-app-delete'));
      expect(deleteIcon).not.toBeNull();
      done();
    });

    const event = new Event('mouseover');
    el.dispatchEvent(event);
  });
});
