import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import { Subject } from 'rxjs/Subject';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs/Rx';

import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/switchMap';

export class UniqueNameValidator {

  static make(flowsService: RESTAPIFlowsService, options: {appId?: string} = {}): AsyncValidatorFn {
    return createUniqueNameValidator(flowsService, options);
  }

}

function createUniqueNameValidator(flowsService: RESTAPIFlowsService, options: {appId?: string} = {}): AsyncValidatorFn {

  // This is used to signal streams to terminate.
  let changed$ = new Subject<any>();

  return (control: AbstractControl): Observable<any> | Promise<any> => {
    if (!control.valueChanges) {
      return Promise.resolve(null);
    }

    changed$.next(); // This will signal the previous stream (if any) to terminate.
    return control.valueChanges
      .takeUntil(changed$)
      .take(1)
      .debounceTime(400)
      .switchMap(value => {
        if (!value || !value.trim()) {
          return Promise.resolve(null);
        }
        return flowsService.findFlowsByName(value, options).then(result => {
          let validationResult = null;
          if (result && result.length) {
            validationResult = { uniqueInvalid: true };
          }
          return validationResult;
        })

      });
  }
}
