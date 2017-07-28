import {Injectable} from "@angular/core";
import {FLOGO_PROFILE_TYPE} from "../constants";
import {RESTAPITriggersService} from "./restapi/triggers-api.service";
import {RESTAPIContributionsService} from "./restapi/v2/contributions.service";
import {activitySchemaToTask, activitySchemaToTrigger} from "../utils";
import {RESTAPIActivitiesService} from "./restapi/activities-api.service";

@Injectable()
export class FlogoProfileService {
  constructor(private triggersService: RESTAPITriggersService,
              private activitiesService: RESTAPIActivitiesService,
              private contribService: RESTAPIContributionsService){

  }
  getProfileType(app) {
    let profileType: FLOGO_PROFILE_TYPE;
    if(app.device){
      profileType = FLOGO_PROFILE_TYPE.DEVICE;
    } else {
      profileType = FLOGO_PROFILE_TYPE.MICRO_SERVICE;
    }
    return profileType;
  }

  getTriggers(profile) {
    let triggerFetchPromise;
    if(profile === FLOGO_PROFILE_TYPE.MICRO_SERVICE){
      triggerFetchPromise = this.triggersService.getTriggers();
    } else {
      triggerFetchPromise = this.contribService.listContribs('trigger');
    }
    return triggerFetchPromise.then(response=> {
      if (response.text()) {
        let data = response.json().data || [];
        return _.map(data, (trigger:any) => {
          if(profile === FLOGO_PROFILE_TYPE.DEVICE){
            trigger.handler = {
              settings: []
            }
          }
          return _.assign(activitySchemaToTrigger(trigger), {
            // TODO fix this installed status.
            // as of now, whatever can be read from db, should have been installed.
            installed : true
          })
        });
      } else {
        return response;
      }
    });
  }

  getActivities(profile){
    let activitiesFetchPromise;
    if(profile === FLOGO_PROFILE_TYPE.MICRO_SERVICE){
      activitiesFetchPromise = this.activitiesService.getActivities();
    } else {
      activitiesFetchPromise = this.contribService.listContribs('activity');
    }
    return activitiesFetchPromise.then(response=> {
      if (response.text()) {
        let data = response.json().data || [];
        return _.map(data, (activity:any) => {
          if(profile === FLOGO_PROFILE_TYPE.DEVICE) {
            activity.inputs = activity.settings;
          }
          return _.assign(activitySchemaToTask(activity), {
            // TODO fix this installed status.
            // as of now, whatever can be read from db, should have been installed.
            installed : true
          })
        });
      } else {
        return response;
      }
    });
  }
}
