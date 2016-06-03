import { Control } from '@angular/common';
import { mappingValidator } from './mapping.validator';
import { TileInOutInfo } from "../models/tile-in-out-info.model";

export function mappingsValidatorFactory(tileInfo:TileInOutInfo) {
  return mappingsValidator.bind(null, tileInfo);
}

export function mappingsValidator(tileInfo: TileInOutInfo, control:Control) : any {

  if(control.getError('invalidJson') || !control.value || _.isEmpty(control.value.trim())) {
    return null;
  }

  let mappings = JSON.parse(control.value);
  if (!_.isArray(mappings)) {
    return {
      notArray: true
    };
  }

  let allErrors : any[] = [];
   mappings.forEach((mapping:any, index:number) => {
    let errors : any[] = mappingValidator(tileInfo, mapping);
    if(errors) {
      allErrors.push({
        index,
        errors,
        value: mapping,
      });
    }
  });

  return _.isEmpty(allErrors) ? null : {
    invalidMappings: {
      valid: false,
      errors: allErrors
    }
  };

}

