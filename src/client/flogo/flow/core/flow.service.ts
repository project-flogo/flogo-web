import { Injectable } from '@angular/core';
import 'rxjs/operator/toPromise';

import { Dictionary, FlowDiagram, Item, TaskDictionary, UiFlow } from '@flogo/core';
import { APIFlowsService } from '@flogo/core/services/restapi/v2/flows-api.service';
import { FlowsService } from '@flogo/core/services/flows.service';

import { flogoFlowToJSON } from '../shared/diagram/models/flow.model';

import { UIModelConverterService } from './ui-model-converter.service';
import { FlogoFlowDetails } from './models';
import { FlowData } from './flow-data';
import { isSubflowTask } from '@flogo/shared/utils';

@Injectable()
export class FlogoFlowService {
  public currentFlowDetails: FlogoFlowDetails;

  constructor(private _flowAPIService: APIFlowsService,
              private _converterService: UIModelConverterService,
              private _commonFlowsService: FlowsService) {
  }

  loadFlow(flowId: string): Promise<FlowData> {
    return this._flowAPIService.getFlow(flowId)
      .then(flow => {
        const subFlowTasks = _.get(flow, 'data.flow.rootTask.tasks', [])
          .concat(_.get(flow, 'data.flow.errorHandlerTask.tasks', []))
          .filter(t => isSubflowTask(t.type));
        const flowIdsToFetch = _.uniq<string>(subFlowTasks.map(t => (t.settings || {}).flowPath));
        if (flowIdsToFetch.length > 0) {
          return Promise.all([flow, this._flowAPIService.getSubFlows(flow.appId, flowIdsToFetch)]);
        }
        return Promise.all([flow, flowIdsToFetch]);
      })
      .then(([flow, subflows]) => {
        const flowDiagramDetails = _.omit(flow, [
          'triggers'
        ]);

        this.currentFlowDetails = new FlogoFlowDetails(flow, subflows);

        const triggers = flow.triggers;
        this._converterService.setProfile(this.currentFlowDetails.applicationProfileType);
        return this._converterService.getWebFlowModel(flowDiagramDetails, this.currentFlowDetails.relatedSubFlows)
          .then(convertedFlow => this.processFlowModel(convertedFlow, flow.triggers.length > 0))
          .then(processedFlow => _.assign({}, processedFlow, { triggers }));
      });
  }

  saveFlow(flowId, uiFlow: UiFlow) {
    const { name, description, flow, metadata } = flogoFlowToJSON(uiFlow);
    const action = { name, description, data: { flow }, metadata };
    return this._flowAPIService.updateFlow(flowId, action);
  }

  deleteFlow(flowId, triggerId) {
    return this._commonFlowsService.deleteFlowWithTrigger(flowId, triggerId);
  }

  listFlowsByName(appId, name) {
    return this._flowAPIService
      .findFlowsByName(name, appId)
      .toPromise();
  }

  listFlowsForApp(appId) {
    return this._flowAPIService.getSubFlows(appId);
  }

  processFlowModel(model, hasTrigger?: boolean): Promise<FlowData> {
    let diagram: FlowDiagram;
    let errorDiagram: FlowDiagram;
    let tasks: Dictionary<Item>;
    let errorTasks: Dictionary<Item>;
    let flow: any;
    if (!_.isEmpty(model)) {
      // initialisation
      console.group('Initialise canvas component');
      flow = model;
      tasks = flow.items;
      if (_.isEmpty(flow.paths)) {
        diagram = flow.paths = <FlowDiagram>{
          root: {},
          nodes: {}
        };
      } else {
        diagram = flow.paths;
      }

      if (_.isEmpty(flow.errorHandler)) {
        flow.errorHandler = {
          paths: {},
          items: {}
        };
      }

      errorTasks = flow.errorHandler.items;
      if (_.isEmpty(flow.errorHandler.paths)) {
        errorDiagram = flow.errorHandler.paths = <FlowDiagram>{
          root: {},
          nodes: {}
        };
      } else {
        errorDiagram = flow.errorHandler.paths;
      }
      if (hasTrigger) {
        diagram.hasTrigger = hasTrigger;
      }
    }
    return Promise.resolve<FlowData>({
      flow,
      root: {
        diagram,
        tasks
      },
      errorHandler: {
        diagram: errorDiagram,
        tasks: errorTasks
      },
      // will be added later
      triggers: [],
    });
  }
}
