import {AbstractModelConverter} from '../ui-converter.model';
import {RESTAPIContributionsService} from '../../../../common/services/restapi/v2/contributions.service';
import {ErrorService} from '../../../../common/services/error.service';

export class DeviceModelConverter extends AbstractModelConverter {
  contribService: RESTAPIContributionsService;
  constructor(contribService: RESTAPIContributionsService,
              errorService: ErrorService) {
    super(errorService);
    this.contribService = contribService;
  }

  getActivitiesPromise(activities) {
    const promises = [];
    activities.forEach(activityRef => {
      promises.push(this.contribService.getContributionDetails(activityRef).then(activity => {
        activity.inputs = activity.settings;
        activity.outputs = [];
        return activity;
      }));
    });
    return Promise.all(promises);
  }

  getTriggerPromise(trigger) {
    if (!trigger.ref) {
      throw this.errorService.makeOperationalError('Trigger: Wrong input json file', 'Cannot get ref for trigger',
        {
          type: 'ValidationError',
          title: 'Wrong input json file',
          detail: 'Cannot get ref for trigger:',
          property: 'trigger',
          value: trigger
        });
    } else {
      return this.contribService.getContributionDetails(trigger.ref);
    }
  }
}
