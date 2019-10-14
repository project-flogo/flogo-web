import { Component, OnInit } from '@angular/core';

import { Resource } from '@flogo-web/core';
import {} from '@flogo-web/plugins/flow-core';
import { ModalInstance } from '@flogo-web/lib-client/modal';
import { makeLocalSearchProvider, LocalSearch } from '@flogo-web/lib-client/search';
import { Observable } from 'rxjs';
import { FlogoFlowService as FlowsService } from '../core/flow.service';
import { FlowResource } from '../core/interfaces';

export interface SubflowSelectionParams {
  appId: string;
  currentFlowId: string;
}

@Component({
  selector: 'flogo-flow-sub-flow',
  templateUrl: 'sub-flow.component.html',
  styleUrls: ['sub-flow.component.less'],
  providers: [
    makeLocalSearchProvider({
      matchFields: ['name', 'description'],
    }),
  ],
})
export class SubFlowComponent implements OnInit {
  private appId: string;
  private readonly currentFlowId: string;
  flows$: Observable<FlowResource[]>;

  constructor(
    private flowService: FlowsService,
    private search: LocalSearch<FlowResource>,
    private modal: ModalInstance<SubflowSelectionParams>
  ) {
    const { appId, currentFlowId } = this.modal.data;
    this.appId = appId;
    this.currentFlowId = currentFlowId;
  }

  ngOnInit() {
    this.flows$ = this.search.list$;
    this.flowService.listFlowsForApp(this.appId).subscribe(resources => {
      const flows = resources.filter(
        flow => flow.id !== this.currentFlowId
      ) as FlowResource[];
      this.search.setSourceList(flows);
    });
  }

  closeModal() {
    this.modal.close();
  }

  filter(query: string) {
    this.search.search(query);
  }

  selectedFlow(flow: Resource) {
    this.modal.close(flow);
  }
}
