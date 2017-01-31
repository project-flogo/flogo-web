import { Injectable } from '@angular/core';
import { CODE_ERRORS, CODE_BROKEN_RULE } from './../constants';

@Injectable()
export class ErrorService {

  constructor() {
  }

  public transformErrors(errors:any[]) : {[key:string]: boolean} {
    let firstError = errors[0];
    if (firstError && firstError.status == 500) {
      // internal error
      return {unknown: true};
    }

    let transformed = {};
    errors.forEach(error => {
      switch (error.code) {
        case CODE_ERRORS.UNIQUE:
          transformed[CODE_BROKEN_RULE.NOT_UNIQUE] = true;
          break;

        case CODE_ERRORS.NOT_INSTALLED_ACTIVITY:
          transformed[CODE_BROKEN_RULE.NOT_INSTALLED_ACTIVITY] = true;
          break;

        case CODE_ERRORS.NOT_INSTALLED_TRIGGER:
          transformed[CODE_BROKEN_RULE.NOT_INSTALLED_TRIGGER] = true;
          break;

        case CODE_ERRORS.WRONG_INPUT_JSON_FILE:
          transformed[CODE_BROKEN_RULE.WRONG_INPUT_JSON_FILE] = true;
          break;
      }

    });

    return transformed;
  }
}