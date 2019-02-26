import { of } from 'rxjs';
import { ComponentFixture, TestBed, tick, fakeAsync, async } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

import {
  CoreModule as FlogoCoreModule,
  FlogoProfileService,
  RESTAPIContributionsService,
} from '@flogo-web/client-core';
import { SharedModule as FlogoSharedModule } from '@flogo-web/client-shared';
import { NotificationsServiceMock } from '@flogo-web/client-core/notifications/testing';
import { FakeRootLanguageModule } from '@flogo-web/client-core/language/testing';
import { NotificationsService } from '@flogo-web/client-core/notifications/notifications.service';

import { RESOURCE_PLUGINS_CONFIG } from '../../core';
import { AppDetailService, ApplicationDetail, AppResourcesStateService } from '../core';
import { FlogoApplicationDetailComponent } from './app-detail.component';
import { FlogoExportFlowsComponent } from '../export-flows/export-flows.component';
import {
  ResourceComponent,
  ResourceListComponent,
  ResourcesGroupByTriggerComponent,
  ResourcesGroupByResourceComponent,
  ResourceBadgeComponent,
  ResourceViewsSelectorComponent,
} from '../resource-views';
import { NewResourceComponent } from '../new-resource/new-resource.component';
import { TriggerShimBuildComponent } from '../shim-trigger/shim-trigger.component';

@Component({
  selector: 'flogo-container',
  template: `
    <flogo-apps-details-application
      [appDetail]="appDetail"
    ></flogo-apps-details-application>
  `,
})
class ContainerComponent {
  appDetail: ApplicationDetail = makeMockAppDetail();
}

class MockAppDetailService extends AppDetailService {
  public reload(): any {
    return null;
  }

  public update(prop: string, value: any): any {
    return null;
  }

  public cancelUpdate(prop: string): any {
    return null;
  }

  public getDownloadLink(appId: string) {
    return appId;
  }
}

class MockRESTAPIContributionsService {
  getShimContributionDetails() {
    return of([]);
  }
}

describe('FlogoApplicationDetailComponent component', () => {
  let comp: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [FakeRootLanguageModule, FlogoCoreModule, FlogoSharedModule],
      declarations: [
        ResourceComponent,
        ResourceListComponent,
        FlogoApplicationDetailComponent,
        ResourcesGroupByTriggerComponent,
        ResourcesGroupByResourceComponent,
        ResourceBadgeComponent,
        ContainerComponent,
        FlogoExportFlowsComponent,
        NewResourceComponent,
        TriggerShimBuildComponent,
        ResourceViewsSelectorComponent,
      ], // declare the test component
      providers: [
        FlogoProfileService,
        AppResourcesStateService,
        { provide: AppDetailService, useClass: MockAppDetailService },
        {
          provide: RESTAPIContributionsService,
          useClass: MockRESTAPIContributionsService,
        },
        {
          provide: NotificationsService,
          useValue: new NotificationsServiceMock(),
        },
        {
          provide: RESOURCE_PLUGINS_CONFIG,
          useValue: [
            {
              label: 'Flow',
              type: 'flow',
              path: 'flow',
              loadChildren: '@flogo-web/plugins/flow-client#FlowModule',
              color: '#96a7f8',
            },
          ],
        },
      ],
    })
      .compileComponents()
      .then(() => done());
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Should display the name correctly when the binding changes', () => {
    const nextApp = makeMockAppDetail();
    nextApp.app.id = '4';
    nextApp.app.name = 'Sample Application 2';
    nextApp.app.updatedAt = new Date();
    comp.appDetail = nextApp;
    fixture.detectChanges();

    const inputName = fixture.debugElement.query(By.css('.qa-app-name'));
    expect(inputName.nativeElement.innerText).toEqual('Sample Application 2');
  });

  xit('When 3 flows provided, it should render 3 flows', () => {
    const flows = fixture.debugElement.queryAll(By.css('.flogo-flow'));
    expect(flows.length).toEqual(3);
  });

  it('Should display creation date', () => {
    const creation = fixture.debugElement.query(
      By.css('.flogo-app-header__date--creation span')
    );
    expect(creation.nativeElement.innerText).toEqual('less than a minute ago.');
  });

  it('Click on Add description should show description input field', () => {
    let inputDescription;

    // because description field is empty, anchor add description should be present
    const addDescription = fixture.debugElement.query(
      By.css('.flogo-app-header__description-container > a')
    );
    expect(addDescription).toBeDefined();

    // input description should not be present
    inputDescription = fixture.debugElement.query(By.css('#appDescription'));
    expect(inputDescription).toBeNull();

    addDescription.nativeElement.click();
    fixture.detectChanges();

    // after click on add description, input appDescription should be present
    inputDescription = fixture.debugElement.query(By.css('#appDescription'));
    expect(inputDescription).toBeDefined();
  });

  it('When description field is empty, Add description link should be visible', () => {
    // because description field is empty, anchor add description should be present
    const addDescription = fixture.debugElement.query(
      By.css('.flogo-app-header__description-container > a')
    );
    expect(addDescription).toBeDefined();
  });

  it('When done editing description input, description should be visible as a label', fakeAsync(() => {
    const newDescription = 'A brief description';
    const addDescription = fixture.debugElement.query(
      By.css('.flogo-app-header__description-container > a')
    );
    addDescription.nativeElement.click();
    fixture.detectChanges();

    const inputDescription = fixture.debugElement.query(By.css('#appDescription'));
    inputDescription.nativeElement.value = newDescription;
    inputDescription.nativeElement.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();

    inputDescription.triggerEventHandler('blur', null);
    tick();
    fixture.detectChanges();

    const labelDescription = fixture.debugElement.query(
      By.css('.flogo-app-header__description')
    );
    expect(
      labelDescription.nativeElement.innerText.indexOf(newDescription) >= 0
    ).toBeTruthy();
  }));

  it('When done editing name input, name should be visible as a label', fakeAsync(() => {
    const newName = 'A cool application';
    const labelApp = fixture.debugElement.query(By.css('.qa-app-name'));
    labelApp.nativeElement.click();
    fixture.detectChanges();

    const nameInput = fixture.debugElement.query(By.css('#appName'));
    nameInput.nativeElement.value = newName;
    nameInput.nativeElement.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();

    nameInput.triggerEventHandler('blur', null);
    tick();
    fixture.detectChanges();

    const labelName = fixture.debugElement.query(By.css('.qa-app-name'));
    expect(labelName.nativeElement.innerText).toEqual(newName);
  }));

  it('When the application has a description the add description link should not be visible', () => {
    const appComponent = fixture.debugElement.query(
      By.css('flogo-apps-details-application')
    );
    appComponent.componentInstance.editableDescription = 'A brief description';
    fixture.detectChanges();

    // because description field is not empty, anchor add description should not be present
    const addDescription = fixture.debugElement.query(
      By.css('.flogo-app-header__description-container > a')
    );
    expect(addDescription).toBeNull();
  });

  it('If it is a new application, its name should be displayed as editable', async(() => {
    const nextApp = makeMockAppDetail();
    nextApp.app.id = '4';
    nextApp.app.name = 'Untitled Application';
    nextApp.app.createdAt = new Date().toISOString();
    comp.appDetail = nextApp;
    // tick(1000);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      const labelName = fixture.debugElement.query(By.css('.flogo-app-header__name'));
      expect(labelName).toBeNull();

      const nameInput = fixture.debugElement.query(By.css('#appName'));
      expect(nameInput).not.toBeNull('Name input is not present');
    });
  }));

  it('If it is not a new application, its name should be displayed as a label', () => {
    const nextApp = makeMockAppDetail();
    nextApp.app.id = '4';
    nextApp.app.name = 'Untitled Application';
    nextApp.app.updatedAt = new Date();
    comp.appDetail = nextApp;
    fixture.detectChanges();

    const labelName = fixture.debugElement.query(By.css('.qa-app-name'));
    const labelElement = labelName.nativeElement;
    expect(labelElement.innerText).toEqual('Untitled Application');
  });
});

function makeMockAppDetail() {
  return {
    app: <any>{
      id: '1',
      name: 'Sample Application 1',
      version: '0.0.1',
      type: 'flogo:app',
      description: null /* should be null for test */,
      createdAt: new Date().toISOString(),
      updatedAt: null /* should be null for test */,
      resources: [
        {
          id: '897',
          name: 'Manually adjust temperature',
          // tslint:disable-next-line max-line-length
          description:
            'A flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Luptas oilsksd as asdfwo',
          createdAt: new Date().toISOString(),
          type: 'sometype',
          data: null,
        },
        {
          id: '987',
          name: 'Raise temperature & notifiy operator',
          // tslint:disable-next-line max-line-length
          description:
            'A basic flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
          createdAt: new Date().toISOString(),
          data: null,
        },
        {
          id: '879',
          name: 'Log temperature',
          // tslint:disable-next-line max-line-length
          description:
            'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
          createdAt: new Date().toISOString(),
          data: null,
        },
      ],
    },
    state: {
      name: {
        pendingSave: false,
        errors: {},
        hasErrors: false,
      },
      description: {
        pendingSave: false,
        errors: {},
        hasErrors: false,
      },
    },
  };
}
