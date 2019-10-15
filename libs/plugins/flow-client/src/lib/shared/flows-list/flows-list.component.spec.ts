import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { SharedModule as FlogoSharedModule } from '@flogo-web/lib-client/common';
import { FakeRootLanguageModule } from '@flogo-web/lib-client/language/testing';

import { RESOURCE_TYPE_FLOW, FlowResource } from '../../core';
import { FlowsListComponent } from './flows-list.component';
import { FlowsListFlowComponent } from './flow/flows-list-flow.component';

describe('Component: FlowsListComponent', () => {
  let comp: FlowsListComponent;
  let fixture: ComponentFixture<FlowsListComponent>;
  let de: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, FlogoSharedModule, FakeRootLanguageModule],
      declarations: [FlowsListComponent, FlowsListFlowComponent],
    });
    fixture = TestBed.createComponent(FlowsListComponent);
    comp = fixture.componentInstance;
    de = fixture.debugElement;
    comp.flows = [];
  });

  it('Should show empty flow message', () => {
    fixture.detectChanges();
    expect(de.nativeElement.textContent.trim()).toEqual('FLOWS-LIST:NOFLOW');
  });

  it('Should list 3 applications', () => {
    comp.flows = getFlowsList();
    fixture.detectChanges();
    expect(de.queryAll(By.css('flogo-flow-flows-list-flow')).length).toEqual(3);
  });

  it("Should emit selected flow's details", done => {
    comp.flows = getFlowsList();
    comp.flowSelected.subscribe(event => {
      expect(event.id).toEqual('flow_1');
      done();
    });
    fixture.detectChanges();
    const firstSelectFlowButton = de.queryAll(
      By.css('flogo-flow-flows-list-flow .qa-button-select')
    )[0].nativeElement;
    firstSelectFlowButton.click();
  });

  function getFlowsList(): FlowResource[] {
    return [
      {
        name: 'hello flow',
        description: '',
        id: 'flow_1',
        type: RESOURCE_TYPE_FLOW,
        createdAt: '2018-01-25T09:50:29.664Z',
        updatedAt: '2018-01-25T09:55:11.088Z',
        data: {
          tasks: [],
          links: [],
        },
      },
      {
        name: 'test flow',
        description: 'hello',
        id: 'flow_2',
        type: RESOURCE_TYPE_FLOW,
        createdAt: '2018-01-25T09:50:29.664Z',
        updatedAt: '2018-01-25T09:55:11.088Z',
        data: {
          tasks: [],
          links: [],
        },
      },
      {
        name: 'flow something',
        description: '',
        id: 'flow_3',
        type: RESOURCE_TYPE_FLOW,
        createdAt: '2018-01-25T09:50:29.664Z',
        updatedAt: '2018-01-25T09:55:11.088Z',
        data: {
          tasks: [],
          links: [],
        },
      },
    ];
  }
});
