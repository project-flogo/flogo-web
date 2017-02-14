import {By} from '@angular/platform-browser';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from 'ng2-translate/ng2-translate';

import {TransformMapperComponent} from './transform-mapper.component';
import {TransformMapperField} from './transform-mapper-field.component';

describe('Component: TransformMapperComponent', () => {
  let mockData = {
    "mappings": [{"type": 1, "mapTo": "pinNumber", "value": "receive-http-message.pathParams"}],
    "precedingTilesOutputs": {
      "receive-http-message": [{"name": "pathParams", "type": "params"}, {
        "name": "queryParams",
        "type": "params"
      }, {"name": "content", "type": "object"}],
      "received": [{"name": "message", "type": "string"}],
      "set-to-output": [{"name": "result", "type": "integer"}]
    },
    "tileInputInfo": [{"name": "method", "type": "string"}, {
      "name": "pinNumber",
      "type": "integer"
    }, {"name": "direction", "type": "string"}, {
      "name": "state",
      "type": "string"
    }]
  }, comp: TransformMapperComponent, fixture: ComponentFixture<TransformMapperComponent>;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(),
        FormsModule,
        ReactiveFormsModule],
      declarations: [TransformMapperComponent, TransformMapperField]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TransformMapperComponent);
        comp = fixture.componentInstance;
        comp.tileInputInfo = mockData.tileInputInfo;
        comp.mappings = mockData.mappings;
        comp.precedingTilesOutputs = mockData.precedingTilesOutputs;
        fixture.detectChanges();
        done();
      });
  });

  it('Should show 4 transform mapper fields', () => {
    let res = fixture.debugElement.queryAll(By.css('flogo-transform-mapper-field'));
    expect(res.length).toBe(4);
  });
});
