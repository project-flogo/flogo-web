import { ConfiguratorComponent } from './configurator.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Store, StoreModule } from '@ngrx/store';
import { FakeRootLanguageModule } from '@flogo-web/client-core/language/testing';

import { featureReducer, FlowState, INITIAL_STATE } from '../../core/state';
import { ConfiguratorModule } from './configurator.module';
import { TriggersMock } from './mocks/triggers.mock';
import { ConfiguratorStatus } from './interfaces';
import { OpenConfigureWithSelection } from '../../core/state/triggers-configure/trigger-configure.actions';

const TEST_STATE: FlowState = {
  ...INITIAL_STATE,
  id: 'abc',
  app: <any>{},
  triggers: {
    trigger1: {
      id: 'trigger1',
      name: 'Receive HTTP Message',
      ref: 'some_path_to_repo/trigger/rest',
      description: 'Simple REST Trigger',
      settings: {
        port: null,
      },
      createdAt: '',
      updatedAt: '',
      handlers: [
        {
          settings: {
            method: 'GET',
            path: null,
            autoIdReply: null,
            useReplyHandler: null,
          },
          resourceId: 'abc',
          outputs: {},
          actionMappings: {
            input: [],
            output: [],
          },
        },
        {
          settings: {
            method: null,
            path: null,
            autoIdReply: null,
            useReplyHandler: null,
          },
          resourceId: 'abc',
          outputs: {},
          actionMappings: {
            input: [],
            output: [],
          },
        },
      ],
    },
    trigger2: {
      id: 'trigger2',
      name: 'Timer',
      createdAt: '',
      updatedAt: '',
      ref: 'some_path_to_repo/trigger/timer',
      description: 'Simple Timer Trigger',
      settings: {
        port: null,
      },
      handlers: [
        {
          settings: {
            method: 'GET',
            path: null,
            autoIdReply: null,
            useReplyHandler: null,
          },
          resourceId: 'abc',
          outputs: {},
          actionMappings: {
            input: [],
            output: [],
          },
        },
        {
          settings: {
            method: null,
            path: null,
            autoIdReply: null,
            useReplyHandler: null,
          },
          resourceId: 'ghi',
          outputs: {},
          actionMappings: {
            input: [],
            output: [],
          },
        },
      ],
    },
  },
  handlers: {
    trigger1: {
      triggerId: 'trigger1',
      resourceId: 'abc',
      settings: {
        method: 'GET',
        path: null,
        autoIdReply: null,
        useReplyHandler: null,
      },
      outputs: {},
      actionMappings: {
        input: [],
        output: [],
      },
    },
    trigger2: {
      triggerId: 'trigger2',
      resourceId: 'ghi',
      settings: {
        method: null,
        path: null,
        autoIdReply: null,
        useReplyHandler: null,
      },
      outputs: {},
      actionMappings: {
        input: [],
        output: [],
      },
    },
  },
};
// todo: fcastill re-enable tests broken due to trigger state changes
xdescribe('ConfiguratorComponent component', () => {
  let triggerSchemas;
  let component: ConfiguratorComponent;
  let fixture: ComponentFixture<ConfiguratorComponent>;
  let de: DebugElement;
  let store: Store<FlowState>;
  const MockData: ConfiguratorStatus = {
    selectedTriggerId: 'trigger_1',
    isOpen: true,
    disableSave: true,
    triggers: [...TriggersMock],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ConfiguratorModule,
        FakeRootLanguageModule,
        StoreModule.forRoot(
          {
            flow: featureReducer,
          },
          {
            initialState: { flow: TEST_STATE },
          }
        ),
      ],
    });
    fixture = TestBed.createComponent(ConfiguratorComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    store = TestBed.get(Store);
    spyOn(store, 'dispatch').and.callThrough();
  });

  beforeEach(function() {
    store.dispatch(
      new OpenConfigureWithSelection({ triggerId: 'trigger1', triggerSchemas })
    );
  });

  it('Should be instantiated without any error', () => {
    expect(component).toBeDefined();
  });

  xit('Should have currentModal "isOpen" status set to false', () => {
    // expect(component.currentConfiguratorState.isOpen).toEqual(false);
  });

  it('Should show exact number of triggers', () => {
    // component.onNextStatus(MockData);
    fixture.detectChanges();
    const triggerElements = fixture.debugElement.queryAll(By.css('.js-trigger-element'));
    expect(triggerElements.length).toEqual(2);
  });

  xit('Should select at least one trigger by default', () => {
    // component.onNextStatus(MockData);
    fixture.detectChanges();
    const triggerElements = fixture.debugElement.queryAll(
      By.css('.js-trigger-element.is-selected')
    );
    expect(triggerElements.length).toEqual(1);
  });

  xit('Should disable save by default', () => {
    // component.onNextStatus(MockData);
    fixture.detectChanges();
    // expect(component.currentConfiguratorState.disableSave).toEqual(true);
  });

  triggerSchemas = {
    'some_path_to_repo/trigger/rest': {
      name: 'flogo-rest',
      type: 'flogo:trigger',
      ref: 'some_path_to_repo/trigger/rest',
      version: '0.0.1',
      title: 'Receive HTTP Message',
      description: 'Simple REST Trigger',
      homepage: 'some_path_to_repo/tree/master/trigger/rest',
      settings: [
        {
          name: 'port',
          type: 'integer',
          required: true,
        },
      ],
      output: [
        {
          name: 'params',
          type: 'params',
        },
        {
          name: 'pathParams',
          type: 'params',
        },
        {
          name: 'queryParams',
          type: 'params',
        },
        {
          name: 'header',
          type: 'params',
        },
        {
          name: 'content',
          type: 'any',
        },
      ],
      reply: [
        {
          name: 'code',
          type: 'integer',
        },
        {
          name: 'data',
          type: 'any',
        },
      ],
      handler: {
        settings: [
          {
            name: 'method',
            type: 'string',
            required: true,
            allowed: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          },
          {
            name: 'path',
            type: 'string',
            required: true,
          },
        ],
      },
    },
    'some_path_to_repo/trigger/timer': {
      name: 'flogo-timer',
      type: 'flogo:trigger',
      ref: 'some_path_to_repo/trigger/timer',
      version: '0.0.1',
      title: 'Timer',
      description: 'Simple Timer trigger',
      homepage: 'some_path_to_repo/tree/master/trigger/timer',
      settings: [],
      output: [
        {
          name: 'params',
          type: 'params',
        },
        {
          name: 'content',
          type: 'object',
        },
      ],
      handler: {
        settings: [
          {
            name: 'repeating',
            type: 'string',
            value: 'false',
            required: true,
          },
          {
            name: 'notImmediate',
            type: 'string',
            value: 'true',
          },
          {
            name: 'startDate',
            type: 'string',
            value: '2018-01-01T12:00:00Z00:00',
          },
          {
            name: 'hours',
            type: 'string',
          },
          {
            name: 'minutes',
            type: 'string',
          },
          {
            name: 'seconds',
            type: 'string',
          },
        ],
      },
    },
  };
});
