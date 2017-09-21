import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';
import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';
import { FlowsModule as FlogoFlowsModule } from '../../flogo.flows/flogo.flows.module';
import { CommonModule as FlogoCommonModule } from '../../../common/common.module';
import { CoreModule as FlogoCoreModule } from '../../../common/core.module';
import { FlogoApplicationComponent } from './application.component';
import { FlogoApplicationSearchComponent } from '../../flogo.apps.search/components/search.component';
import { FlogoApplicationFlowsComponent, FlowGroupComponent } from '../../flogo.apps.flows/components';
import { AppDetailService, ApplicationDetail } from '../../flogo.apps/services/apps.service';
import { FlogoProfileService } from '../../../common/services/profile.service';
import { FlogoAppSettingsComponent } from '../../flogo.apps.settings/components/settings.component';
import { FlogoExportFlowsComponent } from './export-flow.component';


@Component({
  selector: 'flogo-container',
  template: `
            <flogo-apps-details-application [appDetail]="appDetail"></flogo-apps-details-application>
            `
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

describe('FlogoApplicationComponent component', () => {
  const application = null;
  let comp: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;

  function createComponent() {
    return TestBed.compileComponents();
  }

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [
        Ng2Bs3ModalModule,
        TranslateModule.forRoot({
          provide: TranslateLoader,
          useFactory: (http: Http) => new TranslateStaticLoader(http, '/base/dist/public/assets/i18n', '.json'),
          deps: [Http],
        }),
        Ng2Bs3ModalModule,
        FlogoCoreModule,
        FlogoCommonModule,
        FlogoFlowsModule,
      ],
      declarations: [
        FlogoApplicationSearchComponent,
        FlogoAppSettingsComponent,
        FlogoApplicationFlowsComponent,
        FlogoApplicationComponent,
        FlowGroupComponent,
        ContainerComponent,
        FlogoExportFlowsComponent,
      ], // declare the test component
      providers: [
        { provide: AppDetailService, useClass: MockAppDetailService },
        FlogoProfileService
      ],
      //  schemas: [ NO_ERRORS_SCHEMA ]
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

    const inputName = fixture.debugElement.query(By.css('.flogo-app-header__name'));
    expect(inputName.nativeElement.innerText).toEqual('Sample Application 2');
  });

  xit('When 3 flows provided, it should render 3 flows', () => {
    const flows = fixture.debugElement.queryAll(By.css('.flogo-flow'));
    expect(flows.length).toEqual(3);
  });

  it('Should display creation date', () => {
    const creation = fixture.debugElement.query(By.css('.flogo-app-header__date--creation span'));
    expect(creation.nativeElement.innerText).toEqual('a few seconds ago.');
  });


  it('Click on Add description should show description input field', () => {
    let inputDescription;

    // because description field is empty, anchor add description should be present
    const addDescription = fixture.debugElement.query(By.css('.flogo-app-header__description-container > a'));
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
    const addDescription = fixture.debugElement.query(By.css('.flogo-app-header__description-container > a'));
    expect(addDescription).toBeDefined();
  });

  it('When done editing description input, description should be visible as a label', fakeAsync(() => {
    const newDescription = 'A brief description';
    const addDescription = fixture.debugElement.query(By.css('.flogo-app-header__description-container > a'));
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

    const labelDescription = fixture.debugElement.query(By.css('.flogo-app-header__description'));
    expect(labelDescription.nativeElement.innerText.indexOf(newDescription) >= 0).toBeTruthy();
  }));

  it('When done editing name input, name should be visible as a label', fakeAsync(() => {
    const newName = 'A cool application';
    const labelApp = fixture.debugElement.query(By.css('.flogo-app-header__name'));
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

    const labelName = fixture.debugElement.query(By.css('.flogo-app-header__name'));
    expect(labelName.nativeElement.innerText).toEqual(newName);

  }));

  it('When the application has a description the add description link should not be visible', () => {
    const appComponent = fixture.debugElement.query(By.css('flogo-apps-details-application'));
    appComponent.componentInstance.editableDescription = 'A brief description';
    fixture.detectChanges();

    // because description field is not empty, anchor add description should not be present
    const addDescription = fixture.debugElement.query(By.css('.flogo-app-header__description-container > a'));
    expect(addDescription).toBeNull();
  });

  it('If it is a new application, its name should be displayed as editable', fakeAsync(() => {
    const nextApp = makeMockAppDetail();
    nextApp.app.id = '4';
    nextApp.app.name = 'Untitled Application';
    nextApp.app.createdAt = new Date();
    comp.appDetail = nextApp;
    tick();
    fixture.detectChanges();

    const labelName = fixture.debugElement.query(By.css('.flogo-app-header__name'));
    expect(labelName).toBeNull();

    const nameInput = fixture.debugElement.query(By.css('#appName'));
    expect(nameInput).not.toBeNull('Name input is not present');

  }));

  it('If it is not a new application, its name should be displayed as a label', () => {
    const nextApp = makeMockAppDetail();
    nextApp.app.id = '4';
    nextApp.app.name = 'Untitled Application';
    nextApp.app.updatedAt = new Date();
    comp.appDetail = nextApp;
    fixture.detectChanges();

    const labelName = fixture.debugElement.query(By.css('.flogo-app-header__name'));
    const labelElement = labelName.nativeElement;
    expect(labelElement.innerText).toEqual('Untitled Application');
  });

});

function makeMockAppDetail() {
  return {
    app: {
      id: '1',
      name: 'Sample Application 1',
      version: '0.0.1',
      description: null, /* should be null for test */
      createdAt: new Date(),
      updatedAt: null, /* should be null for test */
      flows: [
        {
          id: '897',
          name: 'Manually adjust temperature',
          // tslint:disable-next-line max-line-length
          description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Luptas oilsksd as asdfwo',
          createdAt: new Date()
        },
        {
          id: '987',
          name: 'Raise temperature & notifiy operator',
          // tslint:disable-next-line max-line-length
          description: 'A basic flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
          createdAt: new Date()
        },
        {
          id: '879',
          name: 'Log temperature',
          // tslint:disable-next-line max-line-length
          description: 'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
          createdAt: new Date()
        }
      ],
      flowGroups: []
    },
    state: {
      name: {
        pendingSave: false,
        errors: {},
        hasErrors: false
      },
      description: {
        pendingSave: false,
        errors: {},
        hasErrors: false
      }
    }
  };
}
