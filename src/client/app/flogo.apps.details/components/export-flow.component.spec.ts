import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, DebugElement } from '@angular/core';
import { Http } from '@angular/http';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';
import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';
import { CommonModule as FlogoCommonModule } from '../../../common/common.module';
import { CoreModule as FlogoCoreModule } from '../../../common/core.module';
import {IFlogoApplicationFlowModel } from '../../../common/application.model';
import { AppDetailService } from '../../flogo.apps/services/apps.service';
import { FlogoAppSettingsComponent } from '../../flogo.apps.settings/components/settings.component';
import { FlogoExportFlowsComponent } from './export-flow.component';


@Component({
  selector: 'flogo-export-flow-modal',
  template: `
            <flogo-export-flow [flows]="flows"></flogo-export-flow>
            `
})
class ContainerComponent {
  flows: Array<IFlogoApplicationFlowModel> = makeMockFlows();
}

class MockAppDetailService {
  flows = makeMockAppDetailResponse();

  exportFlow = jasmine.createSpy('exportFlow').and.callFake((flowIds: string) => Promise.resolve(this.flows));

}

describe('FlogoExportFlowsComponent component', () => {
  let containerComponent: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;
  let checkboxList: DebugElement[];
  let exportButton: DebugElement;
  let selectAllLink: DebugElement;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [
        Ng2Bs3ModalModule,
        TranslateModule.forRoot({
          provide: TranslateLoader,
          // TODO: Remove, no http calls should be done in unit tests
          useFactory: (http: Http) => new TranslateStaticLoader(http, '/base/dist/public/assets/i18n', '.json'),
          deps: [Http],
        }),
        Ng2Bs3ModalModule,
        FlogoCoreModule,
        FlogoCommonModule,
      ],
      declarations: [
        // FlogoAppSettingsComponent,
        FlogoExportFlowsComponent,
        ContainerComponent,
      ], // declare the test component
      providers: [
        { provide: AppDetailService, useClass: MockAppDetailService }
      ],
      //  schemas: [ NO_ERRORS_SCHEMA ]
    })
      .compileComponents()
      .then(() => done());

  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerComponent);
    containerComponent = fixture.componentInstance;
    fixture.detectChanges();
    checkboxList = fixture.debugElement.queryAll(By.css('.flogo-export-flow-list input'));
    exportButton = fixture.debugElement.query(By.css('.js-btn-export'));
    selectAllLink = fixture.debugElement.query(By.css('.js-btn-select-all'));
  });

  it('When 2 flows provided, it should render 2 flows', () => {
    const flows = fixture.debugElement.queryAll(By.css('.flogo-export-flow-list'));
    expect(flows.length).toEqual(3);
  });

  it('Should select all flows on click Select All', () => {
    selectAllLink.nativeElement.click();
    fixture.detectChanges();
    const checkedFlowsCount = checkboxList.filter(checkbox => checkbox.nativeElement.checked).length;
    expect(checkedFlowsCount).toEqual(checkboxList.length, 'Expected all flows selected');
  });

  it('Should unselect all flows on click unselect All', () => {
    const unselectAllLink = fixture.debugElement.query(By.css('#unselectAll'));
    unselectAllLink.nativeElement.click();
    fixture.detectChanges();
    const checkedFlowsCount = checkboxList.filter(checkbox => checkbox.nativeElement.checked).length;
    expect(checkedFlowsCount).toEqual(0, 'Expected no flows selected');
  });

  it('Should export only the flows that are selected', () => {
    fixture.detectChanges();
    expect(exportButton.nativeElement.disabled).toBeTruthy();
    // all except last one
    checkboxList.slice(0, -1).forEach(checkboxElement => checkboxElement.nativeElement.click());
    fixture.detectChanges();

    expect(exportButton.nativeElement.disabled).toBeFalsy();
    exportButton.nativeElement.click();
    fixture.detectChanges();

    // all original flows except the last one
    const expectedFlowIds = containerComponent.flows.slice(0, -1).map(flow => flow.id);
    const appDetailServiceSpy = fixture.debugElement.injector.get(AppDetailService);
    expect(appDetailServiceSpy.exportFlow.calls.mostRecent().args).toEqual([expectedFlowIds]);
  });

  // TODO: test case where you want to export all flows

});

  function makeMockFlows() {
    return [
      {
        id: '897',
        name: 'Manually adjust temperature',
        description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent ',
        createdAt: new Date()
      }, {
        id: '898',
        name: 'Manually adjust humidity',
        description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent ',
        createdAt: new Date()
      },
      {
        id: '899',
        name: 'Manually adjust humidity',
        description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent ',
        createdAt: new Date()
      }
    ];
  }

 function makeMockAppDetailResponse() {
    return [{
      id: '897',
      name: 'Manually adjust temperature',
      description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent ',
      createdAt: new Date(),
      updatedAt: null
    }, {
      id: '898',
      name: 'Manually adjust temperature',
      description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent ',
      createdAt: new Date(),
      updatedAt: null
    }];
 }


