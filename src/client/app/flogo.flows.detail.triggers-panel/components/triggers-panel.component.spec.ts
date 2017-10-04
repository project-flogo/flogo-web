import {Component, DebugElement} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from 'ng2-translate';
import {FlogoFlowTriggersPanelComponent} from './triggers-panel.component';
import {By} from '@angular/platform-browser';
import {FlogoSelectTriggerComponent} from '../../flogo.select-trigger/components/select-trigger.component';
import {ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';
import {RESTAPITriggersService} from '../../../common/services/restapi/v2/triggers-api.service';
import {RESTAPIHandlersService} from '../../../common/services/restapi/v2/handlers-api.service';
import {UIModelConverterService} from '../../flogo.flows.detail/services/ui-model-converter.service';
import {PostService} from '../../../common/services/post.service';
import {Router} from '@angular/router';

@Component({
  selector: 'flogo-container',
  template: `
    <flogo-flows-detail-triggers-panel
                [triggers]="triggersList"
                [actionId]="flowId"
                [appDetails]="{appId:'123', appProfileType: profileType}"></flogo-flows-detail-triggers-panel>
  `
})

class ContainerComponent {
  triggersList = [];
  flowId = 'abc';
  public profileType = 0;
  public mockTriggersData() {
    this.triggersList = [{
      'name': 'Receive HTTP Message',
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/trigger/rest',
      'description': 'Simple REST Trigger',
      'settings': {
        'port': null
      },
      'id': 'trigger1',
      'handlers': [
        {
          'settings': {
            'method': 'GET',
            'path': null,
            'autoIdReply': null,
            'useReplyHandler': null
          },
          'actionId': 'abc',
          'outputs': {}
        },
        {
          'settings': {
            'method': null,
            'path': null,
            'autoIdReply': null,
            'useReplyHandler': null
          },
          'actionId': 'abc',
          'outputs': {}
        }
      ]
    }, {
      'name': 'Timer',
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/trigger/timer',
      'description': 'Simple Timer Trigger',
      'settings': {
        'port': null
      },
      'id': 'trigger2',
      'handlers': [
        {
          'settings': {
            'method': 'GET',
            'path': null,
            'autoIdReply': null,
            'useReplyHandler': null
          },
          'actionId': 'abc',
          'outputs': {}
        },
        {
          'settings': {
            'method': null,
            'path': null,
            'autoIdReply': null,
            'useReplyHandler': null
          },
          'actionId': 'ghi',
          'outputs': {}
        }
      ]
    }];
  }
  public mockDeviceTriggerData() {
    this.triggersList = [{
      'name': 'Read From BME',
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/device/trigger/bme280stream',
      'settings': {
        'reading': '',
        'interval': '500'
      },
      'id': 'trigger1',
      'handlers': [{
          'settings': {},
          'actionId': 'abc',
          'outputs': {}
        }]
    }];
  }
}

class MockTriggerService {

}

class MockHandlerService {

}

class MockUIConverterService {

}

class MockRouterService {

}

const postServiceStub = {

  subscribe(options: any) {
    this.subscribeData = options;
  },

  publish(envelope: any) {
    this.published = envelope;
  },

  unsubscribe(sub: any) {
  }

};

describe('Component: FlogoFlowTriggersPanelComponent', () => {
  let comp: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;

  function compileComponent() {
    return TestBed.compileComponents();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [FlogoFlowTriggersPanelComponent, ContainerComponent, ModalComponent, FlogoSelectTriggerComponent],
      providers: [
        {provide: PostService, useValue: postServiceStub },
        {provide: Router, useClass: MockRouterService},
        {provide: RESTAPITriggersService, useClass: MockTriggerService},
        {provide: RESTAPIHandlersService, useClass: MockHandlerService},
        {provide: UIModelConverterService, useClass: MockUIConverterService}
      ]
    });
  });

  it('Should list zero triggers', (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(ContainerComponent);
        comp = fixture.componentInstance;
        fixture.detectChanges();
        const res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-icon-trigger'));
        expect(res.length).toEqual(0);
        done();
      });
  });

  it('Should list three triggers', (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(ContainerComponent);
        comp = fixture.componentInstance;
        comp.mockTriggersData();
        fixture.detectChanges();
        const res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-icon-trigger'));
        expect(res.length).toEqual(3);
        done();
      });
  });

  it('Should always show Add Trigger button for Microservice Profile', (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(ContainerComponent);
        comp = fixture.componentInstance;
        fixture.detectChanges();
        const res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-icon-add'));
        expect(res.length).toEqual(1);
        done();
      });
  });

  it('Should show Add Trigger button for Device Profile when there are no triggers associated to the Flow',
    (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(ContainerComponent);
        comp = fixture.componentInstance;
        comp.profileType = 1;
        fixture.detectChanges();
        const res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-icon-add'));
        expect(res.length).toEqual(1);
        done();
      });
  });

  it('Should not have Add Trigger button for Device Profile when a trigger is already associated to the Flow',
    (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(ContainerComponent);
        comp = fixture.componentInstance;
        comp.profileType = 1;
        comp.mockDeviceTriggerData();
        fixture.detectChanges();
        const res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-icon-add'));
        expect(res.length).toEqual(0);
        done();
      });
  });
});
