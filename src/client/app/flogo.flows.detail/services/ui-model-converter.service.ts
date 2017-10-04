import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';
import {FLOGO_PROFILE_TYPE} from '../../../common/constants';
import {RESTAPITriggersService} from '../../../common/services/restapi/triggers-api.service';
import {RESTAPIActivitiesService} from '../../../common/services/restapi/activities-api.service';
import {ErrorService} from '../../../common/services/error.service';
import {RESTAPIContributionsService} from '../../../common/services/restapi/v2/contributions.service';
import {FlogoProfileService} from '../../../common/services/profile.service';
import {AbstractModelConverter} from '../models/ui-converter.model';
import {MicroServiceModelConverter} from '../models/profiles/microservice-converter.model';
import {DeviceModelConverter} from '../models/profiles/device-converter.model';

@Injectable()
export class UIModelConverterService {
  private converterModelInstance: AbstractModelConverter;

  constructor(public triggerService: RESTAPITriggersService,
              public activityService: RESTAPIActivitiesService,
              public contribService: RESTAPIContributionsService,
              public profileSerivce: FlogoProfileService,
              public errorService: ErrorService) {
  }

  /**
   * Convert Engine Flow Model to UI flow model.
   *
   * @example
   * const uiFlowModel = converterService.runFromRoot({
   *   useFlow: { _id: "flows:flogoweb-admin:2017-02-24T18:21:29.014Z", items: { ... }, paths: {...}  },
   *   attrsData: [{"name":"params", "type":"params", "value":{ "id":3 }}]
   * });
   *
   * runner.state.subscribe(...);
   * runner.completed.subscribe(...);
   *
   * @example
   * try {
   *   const runner = runnerService.getWebFlowModel({
   *    engineFlowObj,
   *    flowTriggerObj
   *   });
   * } catch(error) {
   *    **Error Handling**
   * }
   *
   *
   * @param flowObj - Engine flow model JSON. See mockFlow in ./ui-model-flow.mock.ts
   * @param triggerObj - Engine trigger JSON. see mockTrigger in ./ui-model-trigger.mock.ts
   * @return {Promise<Object>}
   *
   * getWebFlowModel method can throw the following errors:
   *
   * 1. error.type = "ValidationError" -> Will be thrown with Trigger JSON or Flow JSON. When the trigger or activity
   *                                      does not have a 'ref' key for fetching the details of the trigger or activity.
   *
   * 2. error.type = "notInstalledTrigger" -> Will be thrown when the trigger is not installed in the Engine.
   *
   * 3. error.type = "notInstalledActivity" -> Will be thrown when the activity is not installed in the Engine.
   *
   * 4. error.message = "Function linkTiles:Cannot link trigger with first node"
   *                    -> Will be thrown when there is no Link established between trigger and first node.
   *
   * 5. error.message = "Unable to link branches" -> Will be thrown when the link to a branch is not made properly.
   *
   */

  // todo: define interfaces
  getWebFlowModel(flowObj: any) {
    if (this.profileSerivce.getProfileType(flowObj.app) === FLOGO_PROFILE_TYPE.MICRO_SERVICE) {
      this.converterModelInstance = new MicroServiceModelConverter(this.triggerService, this.activityService, this.errorService);
    } else {
      this.converterModelInstance = new DeviceModelConverter(this.contribService, this.errorService);
    }
    return this.converterModelInstance.convertToWebFlowModel(flowObj);
  }

  getTriggerTask(trigger) {
    return this.converterModelInstance.getTriggerPromise(trigger)
      .then((installedTrigger) => {
        return this.converterModelInstance.makeTriggerTask(trigger, installedTrigger);
      });
  }

}
