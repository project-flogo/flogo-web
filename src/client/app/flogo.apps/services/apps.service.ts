import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { IFlogoApplicationModel, Trigger } from '../../../common/application.model';
import { AppsApiService } from '../../../common/services/restapi/v2/apps-api.service';
import { ErrorService } from '../../../common/services/error.service';

const DEFAULT_STATE = {
  name: {
    pendingSave: false,
    hasErrors: false,
    errors: {}
  },
  description: {
    pendingSave: false,
    hasErrors: false,
    errors: {}
  }
};

export interface ApplicationDetailState {
  name: {
    pendingSave: boolean,
    hasErrors: boolean,
    errors: {[key: string]: boolean}
  };
  description: {
    pendingSave: boolean,
    hasErrors: boolean,
    errors: {[key: string]: boolean}
  };
}

export interface FlowGroup {
  trigger: Trigger|null;
  // todo: define interface
  flows: any[];
}

export interface App extends IFlogoApplicationModel {
  flowGroups: FlowGroup[];
}

export interface ApplicationDetail {
  app: App;
  state: ApplicationDetailState;
}

@Injectable()
export class AppDetailService {

  private currentApp$ = new BehaviorSubject<ApplicationDetail>(undefined);
  private fetching: boolean;

  constructor(private appsApiService: AppsApiService, private errorService: ErrorService) {
  }

  public currentApp(): Observable<ApplicationDetail> {
    return this.currentApp$.asObservable();
  }

  public resetApp() {
    this.currentApp$.next(null);
  }

  public load(appId: string) {
    this.fetchApp(appId).then(app => {
      this.currentApp$.next(<ApplicationDetail>_.defaultsDeep({}, {
        app: this.transform(app),
        state: DEFAULT_STATE
      }));
    });
  }

  public reload() {
    this.fetching = true;
    let currentApp = this.currentApp$.getValue();
    if (!currentApp) {
      return;
    }
    this.fetchApp(currentApp.app.id).then(app => {
      const prevApp = this.currentApp$.getValue();
      this.currentApp$.next(<ApplicationDetail>_.defaultsDeep({}, {
        app: this.transform(app),
        state: prevApp.state
      }));
    })
  }

  public update(prop: string, value: any) {
    const appToUpdate = this.getCurrentAsEditable();
    const appToUpdateId = appToUpdate.app.id;
    appToUpdate.state[prop].pendingSave = true;
    this.currentApp$.next(appToUpdate);

    this.appsApiService
      .updateApp(appToUpdate.app.id, {[prop]: value})
      .then(updatedApp => {
        if (!isRequestStillApplicable(appToUpdateId)) {
          return;
        }
        let nextApp = this.getCurrentAsEditable();
        nextApp.app = this.transform(updatedApp);
        nextApp.state[prop] = {
          pendingSave: false,
          hasErrors: false,
          errors: {}
        };
        this.currentApp$.next(nextApp);
      })
      .catch(errors => {
        if (!isRequestStillApplicable(appToUpdateId)) {
          return;
        }
        let nextApp = this.getCurrentAsEditable();
        nextApp.state[prop] = {
          pendingSave: false,
          hasErrors: !!errors.length,
          errors: this.errorService.transformRestErrors(errors)
        };
        this.currentApp$.next(nextApp);
      });

    let isRequestStillApplicable = (forAppId: string) => {
      let nextApp = this.currentApp$.getValue();
      // make sure current app has not changed
      return nextApp.app.id === forAppId;
    };

  }

  public cancelUpdate(prop: string) {
    let nextApp = this.getCurrentAsEditable();
    nextApp.state[prop] = _.cloneDeep(DEFAULT_STATE[prop]);
    this.currentApp$.next(nextApp);
  }

  public deleteApp() {
    const currentApp = this.currentApp$.getValue().app;
    if (!currentApp) {
      return;
    }
    this.appsApiService.deleteApp(currentApp.id)
      .then(() => {
        this.currentApp$.next(<ApplicationDetail>_.defaultsDeep({}, {
          // todo better signal app was deleted
          app: null,
          state: DEFAULT_STATE
        }));
      });
  }

  public toEngineSpec() {
    return this.appsApiService.exportApp(this.currentApp$.getValue().app.id);
  }

  public getDownloadLink(appId: string): string {
    return this.appsApiService.downloadAppLink(appId);
  }

  private fetchApp(appId: string) {
    this.fetching = true;
    return this.appsApiService.getApp(appId)
      .then((app: IFlogoApplicationModel) => {
        this.fetching = false;
        return app;
      });
  }

  private getCurrentAsEditable() {
    return _.cloneDeep(this.currentApp$.getValue());
  }

  private transform(app: IFlogoApplicationModel): App {
    const triggers = app.triggers || [];
    const actions = app.actions || [];
    return <App> Object.assign({}, app, { flowGroups: this.makeFlowGroups(triggers, actions) });
  }

  private makeFlowGroups(triggers, actions): FlowGroup[] {
    const actionMap = new Map(<[string, any][]> actions.map(a => [a.id, a]));

    const pullAction = actionId => {
      let action = actionMap.get(actionId);
      if (action) {
        actionMap.delete(actionId);
      }
      return action;
    };

    const triggerGroups = triggers.map(trigger => {
      return {
        trigger: trigger,
        flows: trigger.handlers
          .map(h => pullAction(h.actionId))
          .filter(flow => !!flow),
      }
    }).filter(triggerGroup => triggerGroup.flows.length > 0);

    // orphan flows
    if (actionMap.size) {
      triggerGroups.unshift({
        trigger: null,
        flows: Array.from(actionMap.values()),
      });
    }

    return triggerGroups;
  }

}

