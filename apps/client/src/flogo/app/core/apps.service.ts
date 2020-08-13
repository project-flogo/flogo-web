import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  from,
  of,
  throwError,
  Observable,
  combineLatest,
  Subject,
} from 'rxjs';
import {
  tap,
  shareReplay,
  switchMap,
  map,
  catchError,
  filter,
  take,
} from 'rxjs/operators';

import { App, ContributionSchema } from '@flogo-web/core';
import {
  AppsService,
  ResourceService,
  ErrorService,
  TriggersService,
  AppResourceService,
  ContributionsService,
  FLOGO_CONTRIB_TYPE,
} from '@flogo-web/lib-client/core';
import { AppResourcesStateService } from './app-resources-state.service';
import { FlowGroup } from './flow-group.interface';
import { TriggerGroup } from './trigger-group.interface';
import { groupByTrigger, groupByResource } from './support';
import { getShimBuildOptions, ShimBuildOptions } from './get-shim-build-options';

interface NewResource {
  name: string;
  type: string;
  description?: string;
}

interface ActionCreationEvent {
  type: 'action-creation';
  action: NewResource;
}

interface ActionErrorEvent {
  type: 'action-error';
  error: Error;
}

type ActionEvents = ActionCreationEvent | ActionErrorEvent;

@Injectable()
export class AppDetailService {
  private appSource = new BehaviorSubject<App>(undefined);
  private actionEventsSource = new Subject<ActionEvents>();
  public readonly groupsByTrigger$: Observable<FlowGroup[]>;
  public readonly groupsByResource$: Observable<TriggerGroup[]>;
  public readonly isEmpty$: Observable<boolean>;

  public app$ = this.appSource.asObservable().pipe(filter<App>(Boolean), shareReplay(1));

  public actionEvent$ = this.actionEventsSource.asObservable();

  constructor(
    private resourcesState: AppResourcesStateService,
    private appsApiService: AppsService,
    private resourceService: ResourceService,
    private triggersService: TriggersService,
    private errorService: ErrorService,
    private appResourceApiService: AppResourceService,
    private contributionService: ContributionsService
  ) {
    const triggersAndResources$ = combineLatest(this.triggers$, this.resources$).pipe(
      shareReplay(1)
    );

    this.groupsByTrigger$ = triggersAndResources$.pipe(
      map(([triggers, resources]) => groupByTrigger(triggers, resources))
    );

    this.groupsByResource$ = triggersAndResources$.pipe(
      map(([triggers, resources]) => groupByResource(triggers, resources))
    );

    this.isEmpty$ = this.resources$.pipe(
      map(resources => !resources || resources.length <= 0),
      shareReplay(1)
    );
  }

  private get triggers$() {
    return this.resourcesState.triggers$;
  }

  private get resources$() {
    return this.resourcesState.resources$;
  }

  public load(appId: string) {
    this.appsApiService.getApp(appId).subscribe(app => {
      this.setApp(app);
    });
  }

  public updateProperty(prop: 'name' | 'description', value: any): Observable<App> {
    const oldApp = this.appSource.getValue();
    const newApp = {
      ...oldApp,
      [prop]: value,
    };
    this.appSource.next(newApp);

    const update$ = this.appsApiService
      .updateApp(oldApp.id, { [prop]: value })
      .pipe(shareReplay(1));

    update$.subscribe(
      () => {
        /* nothing to do we handled the update optimistically */
      },
      () => {
        this.appSource.next(oldApp);
      }
    );

    return update$.pipe(
      catchError(err => throwError(this.errorService.transformRestErrors(err)))
    );
  }

  public deleteApp() {
    const currentApp = this.appSource.getValue();
    return this.appsApiService.deleteApp(currentApp.id);
  }

  public createResource(newResource: NewResource, triggerId?: string) {
    const createResource$ = from(
      this.appResourceApiService.createResource(
        this.appSource.getValue().id,
        newResource,
        triggerId
      )
    ).pipe(
      tap(() => {
        this.actionEventsSource.next({ type: 'action-creation', action: newResource });
      }),
      shareReplay(1)
    );

    createResource$.subscribe(
      ({ resource }) => {
        this.resourcesState.resources = [...this.resourcesState.resources, resource];
      },
      err => {
        console.error(err);
        this.actionEventsSource.next({ type: 'action-error', error: err });
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

  public hasTriggers() {
    return this.triggers$.pipe(
      take(1),
      map(triggers => {
        const appHasTriggers = triggers && triggers.length > 0;
        return !!appHasTriggers;
      })
    );
  }

  public getAvailableShimBuildOptions(): Observable<ShimBuildOptions[]> {
    let triggersUsed$: Observable<Set<string>> = this.groupsByTrigger$.pipe(
      map(flowGroups => {
        return flowGroups.reduce((refsSet, group) => {
          return group.trigger ? refsSet.add(group.trigger.ref) : refsSet;
        }, new Set<string>());
      })
    );
    const shimmableTriggers$: Observable<ContributionSchema[]> = this.contributionService.getShimContributionDetails();
    return combineLatest(triggersUsed$, shimmableTriggers$).pipe(
      map(([triggersUsed, shimTriggerSchemas]) => {
        return shimTriggerSchemas
          .filter(triggerSchema => triggersUsed.has(triggerSchema.ref))
          .map(triggerSchema => getShimBuildOptions(triggerSchema));
      })
    );
  }

  public getShimTriggersListFor(triggerRef: string) {
    return this.groupsByTrigger$.pipe(
      take(1),
      map((flowGroups: FlowGroup[]) =>
        flowGroups.filter(
          flowGroup => flowGroup.trigger && flowGroup.trigger.ref === triggerRef
        )
      )
    );
  }

  public getTriggersSchemas() {
    return this.contributionService.listContribs(FLOGO_CONTRIB_TYPE.TRIGGER);
  }

  public toEngineSpec() {
    return this.appsApiService.exportApp(this.appSource.getValue().id);
  }

  public exportResources(resourceIds: string[]) {
    return this.appsApiService.exportFlows(this.appSource.getValue().id, resourceIds);
  }

  public build(appId, opts: { os: string; arch: string }) {
    return this.appsApiService.buildAndDownload(appId, opts);
  }

  public getResources() {
    return this.resourcesState.resources;
  }

  private setApp(app: App) {
    this.appSource.next(app);
    this.resourcesState.triggers = app.triggers;
    this.resourcesState.resources = app.resources;
  }
}
