import {By} from '@angular/platform-browser';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement}    from '@angular/core';
import {TranslateModule} from 'ng2-translate/ng2-translate';

import {TransformJsonPanelComponent} from './transform-json-panel.component';

describe('Component: TransformJsonPanelComponent', () => {
  let mockData = {
      "outputs": {
        "schema": {
          "receive-http-message": [{"name": "pathParams", "type": "params"}, {
            "name": "queryParams",
            "type": "params"
          }, {"name": "content", "type": "object"}],
          "received": [{"name": "message", "type": "string"}],
          "set-to-output": [{"name": "result", "type": "integer"}]
        },
        "name": "",
        "isInput": false,
        "currentFieldSelected": {"tile": "", "name": ""}
      },
      "inputs": {
        "schema": [{"name": "method", "type": "string"}, {"name": "pinNumber", "type": "integer"}, {
          "name": "direction",
          "type": "string"
        }, {"name": "state", "type": "string"}, {"name": "Pull", "type": "string"}],
        "name": "GetStatus",
        "isInput": true,
        "currentFieldSelected": {"tile": "", "name": ""}
      }
    },
    mockInputSchema: string = '<div class="ft-json__selected" style="margin-left:-15px;">[</div><div class="ft-json__selected" style="margin-left:10px;">{</div><div class="ft-json__selected" style="margin-left:20px;">"name":"method"</div><div class="ft-json__selected" style="margin-left:20px;">"type":"string"</div><div class="ft-json__selected" style="margin-left:10px;">},</div><div class="ft-json__selected" style="margin-left:10px;">{</div><div class="ft-json__selected" style="margin-left:20px;">"name":"pinNumber"</div><div class="ft-json__selected" style="margin-left:20px;">"type":"integer"</div><div class="ft-json__selected" style="margin-left:10px;">},</div><div class="ft-json__selected" style="margin-left:10px;">{</div><div class="ft-json__selected" style="margin-left:20px;">"name":"direction"</div><div class="ft-json__selected" style="margin-left:20px;">"type":"string"</div><div class="ft-json__selected" style="margin-left:10px;">},</div><div class="ft-json__selected" style="margin-left:10px;">{</div><div class="ft-json__selected" style="margin-left:20px;">"name":"state"</div><div class="ft-json__selected" style="margin-left:20px;">"type":"string"</div><div class="ft-json__selected" style="margin-left:10px;">},</div><div class="ft-json__selected" style="margin-left:10px;">{</div><div class="ft-json__selected" style="margin-left:20px;">"name":"Pull"</div><div class="ft-json__selected" style="margin-left:20px;">"type":"string"</div><div class="ft-json__selected" style="margin-left:10px;">}</div><div class="ft-json__selected" style="margin-left:-15px;">]</div>',
    mockOutputSchema: string = '<div class="ft-json__selected" style="margin-left:-10px;">{</div><div class="ft-json__selected" style="">"receive-http-message":[</div><div class="ft-json__selected" style="margin-left:5px;">{</div><div class="ft-json__selected" style="margin-left:10px;">"name":"pathParams"</div><div class="ft-json__selected" style="margin-left:10px;">"type":"params"</div><div class="ft-json__selected" style="margin-left:5px;">},</div><div class="ft-json__selected" style="margin-left:5px;">{</div><div class="ft-json__selected" style="margin-left:10px;">"name":"queryParams"</div><div class="ft-json__selected" style="margin-left:10px;">"type":"params"</div><div class="ft-json__selected" style="margin-left:5px;">},</div><div class="ft-json__selected" style="margin-left:5px;">{</div><div class="ft-json__selected" style="margin-left:10px;">"name":"content"</div><div class="ft-json__selected" style="margin-left:10px;">"type":"object"</div><div class="ft-json__selected" style="margin-left:5px;">}</div><div class="ft-json__selected" style="">]</div><div class="ft-json__selected" style="">"received":[</div><div class="ft-json__selected" style="margin-left:5px;">{</div><div class="ft-json__selected" style="margin-left:10px;">"name":"message"</div><div class="ft-json__selected" style="margin-left:10px;">"type":"string"</div><div class="ft-json__selected" style="margin-left:5px;">}</div><div class="ft-json__selected" style="">]</div><div class="ft-json__selected" style="">"set-to-output":[</div><div class="ft-json__selected" style="margin-left:5px;">{</div><div class="ft-json__selected" style="margin-left:10px;">"name":"result"</div><div class="ft-json__selected" style="margin-left:10px;">"type":"integer"</div><div class="ft-json__selected" style="margin-left:5px;">}</div><div class="ft-json__selected" style="">]</div><div class="ft-json__selected" style="margin-left:-15px;">}</div>',
    comp: TransformJsonPanelComponent, fixture: ComponentFixture<TransformJsonPanelComponent>;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [TransformJsonPanelComponent]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TransformJsonPanelComponent);
        comp = fixture.componentInstance;
        comp.schema = mockData.inputs.schema;
        comp.name = mockData.inputs.name;
        comp.isInput = mockData.inputs.isInput;
        comp.currentFieldSelected = mockData.inputs.currentFieldSelected;
        fixture.detectChanges();
        done();
      });
  });

  it('Shows the block in collapsed state when instantiated', () => {
    let res: Array<DebugElement> = fixture.debugElement
      .queryAll(By.css('.flogo-transformation-json__header--input .flogo-transformation-json__header--collapsed'));
    expect(res.length).toBe(1);
  });

  it('Input JSON mapping is formed as per the given input schema', () => {
    comp.togglePanel();
    fixture.detectChanges();
    let res: DebugElement = fixture.debugElement.query(By.css('.flogo-transformation-json__code'));
    expect(res.nativeElement.innerHTML).toEqual(mockInputSchema);
  });

  it('Output JSON mapping is formed as per the given Outputs schema', () => {
    comp.schema = mockData.outputs.schema;
    comp.name = mockData.outputs.name;
    comp.isInput = mockData.outputs.isInput;
    comp.currentFieldSelected = mockData.outputs.currentFieldSelected;
    comp.togglePanel();
    fixture.detectChanges();
    let res: DebugElement = fixture.debugElement.query(By.css('.flogo-transformation-json__code'));
    expect(res.nativeElement.innerHTML).toEqual(mockOutputSchema);
  });

  it('togglePanel method toggles the JSON mappings of JSON panel', () => {
    comp.togglePanel();
    fixture.detectChanges();
    let res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.flogo-transformation-json__code'));
    expect(res.length).toBe(1);
  });
});
