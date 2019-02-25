import { defaultsDeep, cloneDeep } from 'lodash';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { tap, shareReplay, switchMap } from 'rxjs/operators';

import { App } from '@flogo-web/core';
import {
  AppsApiService,
  ResourceService,
  ErrorService,
  TriggersApiService,
  AppResourceService,
} from '@flogo-web/client-core';
import { NotificationsService } from '@flogo-web/client-core/notifications';

import { ApplicationDetail } from './application-detail.interface';
import { AppResourcesStateService } from './app-resources-state.service';

const DEFAULT_STATE = {
  name: {
    pendingSave: false,
    hasErrors: false,
    errors: {},
  },
  description: {
    pendingSave: false,
    hasErrors: false,
    errors: {},
  },
};

interface NewResource {
  name: string;
  type: string;
  description?: string;
}

@Injectable()
export class AppDetailService {
  private currentApp$ = new BehaviorSubject<ApplicationDetail>(undefined);
  private fetching: boolean;

  constructor(
    private resourcesState: AppResourcesStateService,
    private appsApiService: AppsApiService,
    private resourceService: ResourceService,
    private triggersService: TriggersApiService,
    private notificationsService: NotificationsService,
    private errorService: ErrorService,
    private appResourceApiService: AppResourceService
  ) {}

  public currentApp(): Observable<ApplicationDetail> {
    return this.currentApp$.asObservable();
  }

  public resetApp() {
    this.currentApp$.next(null);
  }

  public load(appId: string) {
    this.fetchApp(appId).then(app => {
      this.setApp(app, DEFAULT_STATE);
    });
  }

  public createResource(newResource: NewResource, triggerId?: string) {
    const createResource$ = from(
      this.appResourceApiService.createResource(
        this.currentApp$.getValue().app.id,
        newResource,
        triggerId
      )
    ).pipe(
      tap(() => {
        this.notificationsService.success({
          key: 'FLOWS:SUCCESS-MESSAGE-FLOW-CREATED',
        });
      }),
      shareReplay(1)
    );

    createResource$.subscribe(
      ({ resource }) => {
        this.resourcesState.resources = [...this.resourcesState.resources, resource];
      },
      err => {
        console.error(err);
        this.notificationsService.error({
          key: 'FLOWS:CREATE_FLOW_ERROR',
          params: err,
        });
      }
    );

    createResource$
      .pipe(
        switchMap(({ handler }: { handler?: { triggerId: string } }) => {
          return handler ? this.triggersService.getTrigger(handler.triggerId) : of(null);
        })
      )
      .subscribe(trigger => {
        if (trigger) {
          const triggers = this.resourcesState.triggers.filter(t => t.id !== trigger.id);
          this.resourcesState.triggers = [...triggers, trigger];
        }
      });
  }

  public removeResource(resourceId: string, triggerId: string) {
    const resources = [...this.resourcesState.resources];
    const resourceIndex = resources.findIndex(r => r.id === resourceId);
    const resource = resources[resourceIndex];
    resources.splice(resourceIndex, 1);
    this.resourcesState.resources = resources;

    this.appResourceApiService.deleteResourceWithTrigger(resourceId, triggerId).subscribe(
      (status: { resourceDeleted?: boolean; triggerDeleted?: boolean }) => {
        if (status && status.triggerDeleted) {
          this.resourcesState.triggers = this.resourcesState.triggers.filter(
            t => t.id !== triggerId
          );
        }
      },
      () => {
        this.resourcesState.resources = [...this.resourcesState.resources, resource];
      }
    );
  }

  public update(prop: string, value: any) {
    const appToUpdate = this.getCurrentAsEditable();
    const appToUpdateId = appToUpdate.app.id;
    if (!appToUpdate.state[prop]) {
      appToUpdate.state[prop] = {};
    }
    appToUpdate.state[prop].pendingSave = true;
    this.currentApp$.next(appToUpdate);

    const isRequestStillApplicable = (forAppId: string) => {
      const nextApp = this.currentApp$.getValue();
      // make sure current app has not changed
      return nextApp.app.id === forAppId;
    };

    this.appsApiService
      .updateApp(appToUpdate.app.id, { [prop]: value })
      .then(updatedApp => {
        if (!isRequestStillApplicable(appToUpdateId)) {
          return;
        }
        const nextApp = this.getCurrentAsEditable();
        nextApp.app = updatedApp;
        nextApp.state[prop] = {
          pendingSave: false,
          hasErrors: false,
          errors: {},
        };
        this.currentApp$.next(nextApp);
      })
      .catch(errors => {
        if (!isRequestStillApplicable(appToUpdateId)) {
          return;
        }
        const nextApp = this.getCurrentAsEditable();
        nextApp.state[prop] = {
          pendingSave: false,
          hasErrors: !!errors.length,
          errors: this.errorService.transformRestErrors(errors),
        };
        this.currentApp$.next(nextApp);
      });
  }

  public cancelUpdate(prop: string) {
    const nextApp = this.getCurrentAsEditable();
    nextApp.state[prop] = cloneDeep(DEFAULT_STATE[prop]);
    this.currentApp$.next(nextApp);
  }

  public deleteApp() {
    const currentApp = this.currentApp$.getValue().app;
    if (!currentApp) {
      return;
    }
    this.appsApiService.deleteApp(currentApp.id).then(() => {
      this.currentApp$.next(<ApplicationDetail>defaultsDeep(
        {},
        {
          // todo better signal app was deleted
          app: null,
          state: DEFAULT_STATE,
        }
      ));
    });
  }

  public toEngineSpec() {
    return this.appsApiService.exportApp(this.currentApp$.getValue().app.id);
  }

  public exportFlow(flowids) {
    return this.appsApiService.exportFlows(this.currentApp$.getValue().app.id, flowids);
  }

  public build(appId, opts: { os: string; arch: string }) {
    return this.appsApiService.buildAndDownload(appId, opts);
  }

  public getDownloadLink(appId: string): string {
    return this.appsApiService.downloadAppLink(appId);
  }

  private fetchApp(appId: string) {
    this.fetching = true;
    return this.appsApiService.getApp(appId).then((app: App) => {
      this.fetching = false;
      return app;
    });
  }

  private setApp(app: App, state: ApplicationDetail['state']) {
    this.currentApp$.next(<ApplicationDetail>defaultsDeep(
      {},
      {
        app,
        state,
      }
    ));
    this.resourcesState.triggers = app.triggers;
    this.resourcesState.resources = app.resources;
  }

  private getCurrentAsEditable() {
    return cloneDeep(this.currentApp$.getValue());
  }
}
