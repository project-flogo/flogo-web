import { Injectable } from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { FLOGO_PROFILE_TYPE } from '@flogo/core';
import { ErrorService } from '@flogo/core/services';
import { RESTAPIContributionsService } from '../../core/services/restapi/v2/contributions.service';
import { AbstractModelConverter } from './models/ui-converter.model';
import { MicroServiceModelConverter } from './models/profiles/microservice-converter.model';
import { DeviceModelConverter } from './models/profiles/device-converter.model';
import {ActionBase} from '@flogo/core';

@Injectable()
export class UIModelConverterService {
  private converterModelInstance: AbstractModelConverter;

  constructor(public contribService: RESTAPIContributionsService,
              public errorService: ErrorService) {
  }

  setProfile(profile: FLOGO_PROFILE_TYPE) {
    if (profile === FLOGO_PROFILE_TYPE.MICRO_SERVICE) {
      this.converterModelInstance = new MicroServiceModelConverter(this.contribService, this.errorService);
    } else {
      this.converterModelInstance = new DeviceModelConverter(this.contribService, this.errorService);
    }
  }

  /**
   * Convert Engine Flow Model to UI flow model.
   *
   * @param flowObj - Engine flow model JSON. See mockFlow in ./ui-model-flow.mock.ts
   * @param subflowSchemas - Map object which maintains the registry of flow schemas used as subflows
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
  getWebFlowModel(flowObj: any, subflowSchemas: Map<string, ActionBase>) {
    return this.converterModelInstance.convertToWebFlowModel(flowObj, subflowSchemas);
  }

  getTriggerTask(trigger) {
    return this.converterModelInstance.getTriggerSchema(trigger)
      .then((installedTrigger) => {
        return this.converterModelInstance.makeTriggerTask(trigger, installedTrigger);
      });
  }

}
