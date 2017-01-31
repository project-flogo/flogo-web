import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import { IFlogoApplicationModel } from '../../../common/application.model';
import { RESTAPIApplicationsService } from '../../../common/services/restapi/applications-api.service';
import { ApiError } from '../../../common/services/restapi/restapi.model';
import { ErrorService } from '../../../common/services/error.service';;

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
    errors: {[key:string]: boolean}
  },
  description: {
    pendingSave: boolean,
    hasErrors: boolean,
    errors: {[key:string]: boolean}
  }
}

export interface ApplicationDetail {
  app: IFlogoApplicationModel,
  state: ApplicationDetailState
}

@Injectable()
export class AppDetailService {

  private currentApp$ = new BehaviorSubject<ApplicationDetail>(undefined);
  private fetching: boolean;

  constructor(private appsApiService : RESTAPIApplicationsService, private errorService: ErrorService) {
  }

  public currentApp() :Observable<ApplicationDetail> {
    return this.currentApp$.asObservable();
  }

  public load(appId:string) {
    this.fetchApp(appId).then(app => {
      this.currentApp$.next(<ApplicationDetail>_.defaultsDeep({}, {
        app,
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
        app,
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
        if(!isRequestStillApplicable(appToUpdateId)) {
          return;
        }
        let nextApp = this.getCurrentAsEditable();
        nextApp.app = updatedApp;
        nextApp.state[prop] = {
          pendingSave: false,
          hasErrors: false,
          errors: {}
        };
        this.currentApp$.next(nextApp);
      })
      .catch(errors => {
        if(!isRequestStillApplicable(appToUpdateId)) {
          return;
        }
        let nextApp = this.getCurrentAsEditable();
        nextApp.state[prop] = {
          pendingSave: false,
          hasErrors: !!errors.length,
          errors: this.errorService.transformErrors(errors)
        };
        this.currentApp$.next(nextApp);
      });

    let isRequestStillApplicable = (forAppId:string) => {
      let nextApp = this.currentApp$.getValue();
      // make sure current app has not changed
      return nextApp.app.id == forAppId;
    }

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
    return this.appsApiService.export(this.currentApp$.getValue().app.id);
  }

  private fetchApp(appId:string) {
    this.fetching = true;
    return this.appsApiService.getApp(appId)
      .then((app :IFlogoApplicationModel) => {
        this.fetching = false;
        return app;
      });
  }

  private getCurrentAsEditable() {
    return _.cloneDeep(this.currentApp$.getValue());
  }

}

