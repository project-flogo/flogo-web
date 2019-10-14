import { isEqual } from 'lodash';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { of as observableOfValue, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Resource } from '@flogo-web/core';
import { ResourceService, AppResourceService } from '@flogo-web/lib-client/core';

import { savableFlow } from './models/backend-flow/flow.model';
import { MicroServiceModelConverter } from './models/profiles/microservice-converter.model';
import { FlogoFlowDetails } from './models/flow-details.model';
import { loadFlow } from './models/load-flow';
import { FlowData } from './flow-data';
import { AppState } from './state/app.state';
import { FlowState, Init } from './state';
import { FlowResource, ApiFlowResource, UiFlow } from './interfaces';

const isFlow = (r: Resource): r is FlowResource => r.type === 'flow';

@Injectable()
export class FlogoFlowService {
  public currentFlowDetails: FlogoFlowDetails;
  private previousSavedFlow: FlowResource = null;

  constructor(
    private converterService: MicroServiceModelConverter,
    private appResourceService: AppResourceService,
    private resourceService: ResourceService,
    private store: Store<AppState>
  ) {}

  loadFlow(resource: ApiFlowResource): Observable<FlowData> {
    this.previousSavedFlow = null;

    const fetchSubflows = subflowIds =>
      this.resourceService.listSubresources(resource.appId, subflowIds);
    const convertServerToUIModel = (fromResource, linkedSubflows) =>
      this.converterService.convertToWebFlowModel(fromResource, linkedSubflows);
    return loadFlow(fetchSubflows, convertServerToUIModel, resource).pipe(
      tap(({ convertedFlow, triggers, handlers, linkedSubflows }) => {
        this.currentFlowDetails = new FlogoFlowDetails(resource.id, this.store);
        this.previousSavedFlow = savableFlow(convertedFlow);
        this.store.dispatch(
          new Init({
            ...convertedFlow,
            triggers,
            handlers,
            linkedSubflows,
          } as FlowState)
        );
      }),
      map(({ convertedFlow, flowTriggers }) => ({
        flow: convertedFlow,
        triggers: flowTriggers,
      }))
    );
  }

  saveFlow(flowId, uiFlow: UiFlow) {
    return this.resourceService.updateResource(flowId, savableFlow(uiFlow));
  }

  saveFlowIfChanged(flowId, uiFlow: UiFlow) {
    const flow = savableFlow(uiFlow);
    if (this.didFlowChange(flow)) {
      this.previousSavedFlow = flow;
      return this.resourceService.updateResource(flowId, flow);
    } else {
      return observableOfValue(false);
    }
  }

  deleteFlow(flowId, triggerId) {
    return this.appResourceService
      .deleteResourceWithTrigger(flowId, triggerId)
      .toPromise();
  }

  listFlowsByName(appId, name) {
    return this.resourceService.listResourcesWithName(name, appId).toPromise();
  }

  listFlowsForApp(appId): Observable<FlowResource[]> {
    return this.resourceService
      .listSubresources(appId)
      .pipe(map(resources => resources.filter(isFlow)));
  }

  private didFlowChange(nextValue: FlowResource) {
    return !isEqual(this.previousSavedFlow, nextValue);
  }
}
