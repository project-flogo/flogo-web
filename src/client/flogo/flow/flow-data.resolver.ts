import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { FlogoFlowService } from '@flogo/flow/core';
import { FlowData } from './core';
import {FlogoFlowDiagramNode} from '@flogo/flow/shared/diagram/models';

@Injectable()
export class FlowDataResolver implements Resolve<FlowData> {

  constructor(private flowService: FlogoFlowService) {}

  resolve(route: ActivatedRouteSnapshot) {
    const flowId = route.params['id'];
    FlogoFlowDiagramNode.resetCount();
    return this.flowService.loadFlow(flowId);
  }

}
