import {By} from '@angular/platform-browser';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component, ViewChild}    from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from 'ng2-translate/ng2-translate';

import {TransformMapperField} from './transform-mapper-field.component';

@Component({
  selector: 'contianer',
  template: `<flogo-transform-mapper-field
                [tile]="tile"
                [mappings]="mappings"
                [tileInputInfo]="tileInputInfo"
                [tileInfo]="tileInfo"
                (mappingChange)="onMappingChange($event)"
                (itemOver)="onItemOver($event)"
                [precedingTilesOutputs]="precedingTilesOutputs"></flogo-transform-mapper-field>`
})
class Container {
  @ViewChild(TransformMapperField)
  public transformMapperField : any;
  tile = {"name": "pinNumber", "type": "integer"};
  mappings = [];
  precedingTilesOutputs ={
    "receive-http-message": [{"name": "pathParams", "type": "params"}, {
      "name": "queryParams",
      "type": "params"
    }, {"name": "content", "type": "object"}],
    "received": [{"name": "message", "type": "string"}],
    "set-to-output": [{"name": "result", "type": "integer"}]
  };
  tileInputInfo = [{"name": "method", "type": "string"}, {
    "name": "pinNumber",
    "type": "integer"
  }, {"name": "direction", "type": "string"}, {
    "name": "state",
    "type": "string"
  }];
  tileInfo = {
    "attributes": {
      "method": "string",
      "pinNumber": "integer",
      "direction": "string",
      "state": "string",
      "Pull": "string"
    },
    "precedingOutputs": {
      "receive-http-message.pathParams": {"name": "pathParams", "type": "params"},
      "receive-http-message.queryParams": {"name": "queryParams", "type": "params"},
      "receive-http-message.content": {"name": "content", "type": "object"},
      "received.message": {"name": "message", "type": "string"},
      "set-to-output.result": {"name": "result", "type": "integer"}
    }
  };

  onMappingChange() {}
  onItemOver() {}
}

describe('Component: TransformMapperField', () => {
  let comp: Container, fixture: ComponentFixture<Container>;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      declarations: [Container, TransformMapperField]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(Container);
        comp = fixture.componentInstance;
        done();
      });
  });

  it('Should maintain the mappings if any', () => {
    comp.mappings.push({"type": 1, "mapTo": "pinNumber", "value": "receive-http-message.pathParams"});
    fixture.detectChanges();
    expect(comp.transformMapperField.selectedValue).toEqual('receive-http-message.pathParams');
  });

  it('Should open the list of previous tiles outputs on focus of mapper input', () => {
    fixture.detectChanges();
    let inputElem = fixture.debugElement.query(By.css('.output-text'));
    inputElem.triggerEventHandler('click', null);
    expect(comp.transformMapperField.showList).toEqual(true);
  });

  it('Should select a previous tiles output for mapper input', () => {
    fixture.detectChanges();
    let inputElem = fixture.debugElement.query(By.css('.output-text'));
    inputElem.triggerEventHandler('click', null);
    let prevTileOutputs = fixture.debugElement.queryAll(By.css('.flogo-visual-mapper__item__name'));
    prevTileOutputs[0].triggerEventHandler('click',null);
    let prevTileOutputItem = fixture.debugElement.queryAll(By.css('.flogo-visual-mapper__item__list__field'));
    prevTileOutputItem[0].triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(comp.transformMapperField.selectedValue).toEqual('receive-http-message.pathParams');
  });

  it('Should clear the mapping when clicked on the cross button', () => {
    comp.mappings.push({"type": 1, "mapTo": "pinNumber", "value": "receive-http-message.pathParams"});
    fixture.detectChanges();
    let removeSelectionElem = fixture.debugElement.query(By.css('.flogo-visual-mapper__item__remove'));
    removeSelectionElem.triggerEventHandler('click', null);
    expect(comp.transformMapperField.selectedValue).toEqual('');
  });
});
