import {Injectable} from "@angular/core";
import {FLOGO_PROFILE_TYPE} from "../constants";

@Injectable()
export class FlogoProfileService {
  getProfileType(app) {
    let profileType: FLOGO_PROFILE_TYPE;
    if(app.device){
      profileType = FLOGO_PROFILE_TYPE.DEVICE;
    } else {
      profileType = FLOGO_PROFILE_TYPE.MICRO_SERVICE;
    }
    return profileType;
  }
}
