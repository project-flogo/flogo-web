import {By} from '@angular/platform-browser';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement}    from '@angular/core';
import {TranslateModule} from 'ng2-translate/ng2-translate';

import {ErrorDisplayComponent} from './error-display.component';

describe('Component: ErrorDisplayComponent', () => {
  let errorTypes = {
      "mappingError": {
        "invalidMappings": {
          "errors": [{
            "index": 0,
            "errors": {"value": {"invalidValue": true}},
            "value": {"type": 1, "value": "received.message.g", "mapTo": "flowInfo"}
          },{
            "index": 1,
            "errors": {"mapTo": {"missing": true}},
            "value": {"type": 1, "value": "received.message.g", "mapTo": "flowInfo"}
          }]
        }
      },
      "jsonError": {
        "invalidJson": true
      },
      "arrayError": {
        "notArray": true
      }
    }, comp: ErrorDisplayComponent, fixture: ComponentFixture<ErrorDisplayComponent>;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ErrorDisplayComponent]
    })
      .compileComponents()
      .then(()=>{
        fixture = TestBed.createComponent(ErrorDisplayComponent);
        comp = fixture.componentInstance;
        done();
      });
  });

  it('Shows the errors block only when there are any errors', () => {
      let res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.transform-error-wrapper'));
      expect(res.length).toEqual(0);
  });

  it('Show error for invalid transform mappings - invalid JSON', () => {
        comp.errors = errorTypes.jsonError;
        fixture.detectChanges();
        let res: DebugElement = fixture.debugElement.query(By.css('.transform-error-msg'));
        expect(res.nativeElement.innerHTML).toEqual('TRANSFORM-ERROR:INVALID-JSON');
  });

  it('Show error for invalid transform mappings - Not an Array', () => {
        comp.errors = errorTypes.arrayError;
        fixture.detectChanges();
        let res: DebugElement = fixture.debugElement.query(By.css('.transform-error-msg'));
        expect(res.nativeElement.innerHTML).toEqual('TRANSFORM-ERROR:NOT-ARRAY');
  });

  it('Show 2 errors', () => {
        comp.errors = errorTypes.mappingError;
        fixture.detectChanges();
        let res: Array<DebugElement> = fixture.debugElement.queryAll(By.css('.transform-error-msg'));
        expect(res.length).toEqual(2);
  });
});
