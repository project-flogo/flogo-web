import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FakeRootLanguageModule } from '@flogo-web/client-core/language/testing';
import { Trigger } from '../../core';
import { TriggerBlockComponent } from './trigger-block.component';

@Component({
  selector: 'flogo-container',
  template: `
    <flogo-flow-triggers-trigger-block
      #triggerBlock
      [trigger]="triggerEntity"
      (menuItemSelected)="checkMenuAction($event)"
    ></flogo-flow-triggers-trigger-block>
  `,
})
class FlogoContainerComponent {
  triggerEntity: Trigger;
  @ViewChild('triggerBlock') triggerBlock: TriggerBlockComponent;

  constructor() {
    this.triggerEntity = {
      name: 'Timer',
      ref: 'some_path_to_repo/trigger/timer',
      description: 'Simple Timer trigger',
      settings: {},
      id: '432423',
      createdAt: '',
      updatedAt: '',
      handlers: [
        {
          settings: {},
          outputs: {},
          actionMappings: {
            input: [],
            output: [],
          },
          resourceId: '435435',
        },
      ],
      appId: '34543523',
      handler: {
        settings: {},
        outputs: {},
        actionMappings: {
          input: [],
          output: [],
        },
        resourceId: '435643',
      },
    };
  }

  checkMenuAction(event) {}
}

describe('Component: TriggerBlockComponent', () => {
  let comp: FlogoContainerComponent;
  let fixture: ComponentFixture<FlogoContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FakeRootLanguageModule],
      declarations: [FlogoContainerComponent, TriggerBlockComponent],
    });
  });

  beforeEach(done => {
    return TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(FlogoContainerComponent);
      comp = fixture.componentInstance;
      done();
    });
  });

  it('When initiated trigger is not selected', () => {
    comp = fixture.componentInstance;
    fixture.detectChanges();
    const triggerBlock: Array<DebugElement> = fixture.debugElement.queryAll(
      By.css('.trigger_block--selected')
    );
    expect(triggerBlock.length).toEqual(0);
  });

  describe('for microservice profiles', () => {
    it('trigger menu should open when hovered on trigger and it should be selected', () => {
      comp.triggerBlock.handleTriggerMenuShow();
      fixture.detectChanges();
      expect(comp.triggerBlock.isShowingMenu).toEqual(true);
    });

    it('trigger settings must be shown when trigger is selected', done => {
      fixture.detectChanges();
      comp.triggerBlock.menuItemSelected.subscribe(data => {
        expect(data.operation).toEqual('show-settings');
        done();
      });
      comp.triggerBlock.handleTriggerSelection();
      fixture.detectChanges();
    });
  });
});
