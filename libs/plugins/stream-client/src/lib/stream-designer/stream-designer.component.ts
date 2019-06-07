import { Component, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { isEmpty } from 'lodash';

import { ValueType, Metadata as ResourceMetadata } from '@flogo-web/core';

import {
  DiagramSelection,
  DiagramAction,
  DiagramActionType,
  DiagramActionSelf,
  DiagramSelectionType,
} from '@flogo-web/lib-client/diagram';
import { SimulatorService } from '../simulator.service';
import { ParamsSchemaComponent } from '../params-schema';
import { FlogoFlowService, StreamParams } from '../core';
import { FlowState } from '../core/state';
import { SingleEmissionSubject } from '@flogo-web/lib-client/core';
import { FlogoFlowService as FlowsService } from '../core/flow.service';
import { NotificationsService } from '@flogo-web/lib-client/notifications';

const SAMPLE_FIELDS = {
  stream: {
    inputGraph: 'd3_y_bar',
    outputGraph: 'd3_y_line',
    inputGraphFields: ['pressure', 'amps'],
    input: [
      { name: 'ID', type: ValueType.String },
      { name: 'timeslot', type: ValueType.Long },
      { name: 'pressure', type: ValueType.Long },
      { name: 'amps', type: ValueType.Long },
    ],
    output: [
      { name: 'err', type: ValueType.Long },
      { name: 'pred', type: ValueType.Long },
    ],
  },
  ml: {
    inputGraph: 'd3_y_area',
    outputGraph: 'd3_y_bar',
    input: [
      { name: 'station', type: ValueType.Integer },
      { name: 'visitor', type: ValueType.Integer },
    ],
    output: [
      { name: 'err', type: ValueType.Long },
      { name: 'pred', type: ValueType.Long },
    ],
  },
};

const ML_ID = 'inference_4';

@Component({
  selector: 'flogo-stream-designer',
  templateUrl: './stream-designer.component.html',
  styleUrls: ['./stream-designer.component.less'],
  providers: [SimulatorService],
})
export class StreamDesignerComponent implements OnDestroy {
  flowState: FlowState;
  isPanelOpen = false;
  isMenuOpen = false;
  backToAppHover = false;
  graph;
  currentSelection: DiagramSelection;
  resourceMetadata: Partial<ResourceMetadata> = {
    input: [
      { name: 'ID', type: ValueType.String },
      { name: 'timeslot', type: ValueType.Integer },
      { name: 'pressure', type: ValueType.Integer },
      { name: 'amps', type: ValueType.Integer },
    ],
    output: [
      { name: 'out1', type: ValueType.Integer },
      { name: 'out2', type: ValueType.Integer },
    ],
  };
  flowName: string;
  simulatorFields: Partial<ResourceMetadata> = SAMPLE_FIELDS.stream;
  simulateActivity;
  simulationId = 0;
  private ngOnDestroy$ = SingleEmissionSubject.create();

  @ViewChild('metadataModal') metadataModal: ParamsSchemaComponent;

  constructor(
    private simulationService: SimulatorService,
    private streamService: FlogoFlowService,
    private router: Router,
    private _flowService: FlowsService,
    private notifications: NotificationsService
  ) {
    const { mainGraph, mainItems } = mockResource();
    this.graph = mainGraph;
    this.streamService.currentFlowDetails.flowState$
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(flowState => {
        this.flowState = flowState;
        this.flowName = flowState.name;
      });
  }

  get flowId() {
    return this.flowState && this.flowState.id;
  }

  ngOnDestroy() {
    this.ngOnDestroy$.emitAndComplete();
  }

  get applicationId() {
    return this.flowState && this.flowState.appId;
  }

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;

    if (!this.isPanelOpen) {
      this.simulationService.stopSimulation();
      return;
    }
    this.restartSimulation();
  }

  onDiagramAction(action: DiagramAction) {
    if (action.type === DiagramActionType.Select) {
      this.onDiagramSelection(action as DiagramActionSelf);
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  deleteStream() {
    this.closeMenu();
  }

  navigateToApp() {
    // todo: nice to have: this.activatedResource.navigateToApp()
    // or: this.router.navigate(this.activatedResource.getAppUrl());
    this.router.navigate(['/apps', this.applicationId]);
  }

  onMouseOverBackControl() {
    this.backToAppHover = true;
  }

  onMouseOutBackControl() {
    this.backToAppHover = false;
  }

  openMetadataModal() {
    this.metadataModal.openInputSchemaModel();
  }

  onResourceMetadataSave(params: StreamParams) {
    this.resourceMetadata = { ...params.metadata };
    // if (this.isPanelOpen) {
    //   this.simulationService.startSimulation(this.resourceMetadata);
    // }
    this.streamService.currentFlowDetails.updateMetadata(params);
  }

  public changeFlowDetailName(name, property) {
    if (name === this.flowName) {
      return Promise.resolve(true);
    } else if (!name || !name.trim()) {
      this.flowState.name = this.flowName;
      return Promise.resolve(true);
    }

    return this._flowService
      .listFlowsByName(this.flowState.appId, name)
      .then(flows => {
        const results = flows || [];
        if (!isEmpty(results)) {
          if (results[0].id === this.flowId) {
            return;
          }
          this.flowState.name = this.flowName;
          this.notifications.error({
            key: 'CANVAS:FLOW-NAME-EXISTS',
            params: { value: name },
          });
          return results;
        } else {
          this.flowState.name = name;
          this._updateFlow()
            .then((response: any) => {
              this.notifications.success({
                key: 'CANVAS:SUCCESS-MESSAGE-UPDATE-STREAM',
                params: { value: property },
              });
              this.flowName = this.flowState.name;
              return response;
            })
            .catch(err => {
              this.notifications.error({
                key: 'CANVAS:ERROR-MESSAGE-UPDATE-STREAM',
                params: { value: property },
              });
              return Promise.reject(err);
            });
        }
      })
      .catch(err => {
        this.notifications.error({
          key: 'CANVAS:ERROR-MESSAGE-UPDATE-STREAM',
          params: { value: property },
        });
        return Promise.reject(err);
      });
  }

  private onDiagramSelection(action: DiagramActionSelf) {
    const isNewSelection =
      !this.currentSelection || this.currentSelection.taskId !== action.id;
    if (isNewSelection) {
      const taskId = action.id;
      this.currentSelection = {
        diagramId: 'stream',
        taskId,
        type: DiagramSelectionType.Node,
      };
      const selectedActivity = mockResource().mainGraph.nodes[taskId];
      this.simulateActivity = {
        id: selectedActivity.id,
        name: selectedActivity.title,
        description: selectedActivity.description,
        icon: selectedActivity.icon,
        schemaHomepage: selectedActivity.homepage,
      };
      if (taskId === ML_ID) {
        this.simulatorFields = SAMPLE_FIELDS.ml;
      } else {
        this.simulatorFields = SAMPLE_FIELDS.stream;
      }
    } else {
      this.currentSelection = null;
      this.simulateActivity = null;
      this.simulatorFields = SAMPLE_FIELDS.stream;
    }

    if (this.isPanelOpen) {
      this.restartSimulation();
    }
  }

  private restartSimulation() {
    this.simulationId++;
    console.log(this.simulationId);
    if (this.currentSelection && this.currentSelection.taskId === ML_ID) {
      this.simulationService.startSimulation(this.simulationId, 'ml');
    } else {
      this.simulationService.startSimulation(this.simulationId, 'stream');
    }
  }

  private _updateFlow() {
    return this._flowService.saveFlowIfChanged(this.flowId, this.flowState).toPromise();
  }

  public changeFlowDetail($event, property) {
    return this._updateFlow()
      .then(wasSaved => {
        if (wasSaved) {
          this.notifications.success({
            key: 'CANVAS:SUCCESS-MESSAGE-UPDATE-STREAM',
            params: { value: property },
          });
        }
        return wasSaved;
      })
      .catch(() =>
        this.notifications.error({
          key: 'CANVAS:ERROR-MESSAGE-UPDATE-STREAM',
          params: { value: property },
        })
      );
  }
}

function mockResource() {
  return {
    mainItems: {
      filter_2: {
        name: 'Filter',
        description: 'Simple Filter Activity',
        settings: {},
        ref: 'github.com/project-flogo/stream/activity/filter',
        id: 'filter_2',
        inputMappings: {},
        type: 1,
        return: false,
        activitySettings: {
          proceedOnlyOnEmit: true,
        },
        input: {
          value: null,
        },
      },
      aggregate_3: {
        name: 'Aggregate',
        description: 'Simple Aggregate Activity',
        settings: {},
        ref: 'github.com/project-flogo/stream/activity/aggregate',
        id: 'aggregate_3',
        inputMappings: {},
        type: 1,
        return: false,
        activitySettings: {},
        input: {
          value: null,
        },
      },
      [ML_ID]: {
        name: 'Invoke ML Model',
        description:
          'Basic inferencing activity to invoke ML model using the flogo-ml framework.',
        settings: {},
        ref: 'github.com/project-flogo/ml/activity/inference',
        id: ML_ID,
        inputMappings: {
          sigDefName: 'serving_default',
          tag: 'serve',
        },
        type: 1,
        return: false,
        activitySettings: {},
        input: {
          model: '',
          features: [],
          framework: '',
          sigDefName: 'serving_default',
          tag: 'serve',
        },
      },
      mqtt_5: {
        name: 'MQTT Activity',
        description: 'Send MQTT message',
        settings: {},
        ref: 'github.com/project-flogo/edge-contrib/activity/mqtt',
        id: 'mqtt_5',
        inputMappings: {},
        type: 1,
        return: false,
        activitySettings: {},
        input: {
          message: '',
        },
      },
    },
    mainGraph: {
      rootId: 'filter_2',
      nodes: {
        filter_2: {
          type: 'task',
          id: 'filter_2',
          title: 'Filter',
          icon: 'filter',
          description: 'Simple Filter Activity',
          homepage: 'https://github.com/project-flogo/stream/tree/master/activity/filter',
          features: {
            selectable: true,
            canHaveChildren: true,
            canBranch: true,
            deletable: true,
            subflow: false,
            final: false,
          },
          status: {
            invalid: false,
            executed: false,
            executionErrored: null,
            iterable: false,
          },
          children: ['aggregate_3'],
          parents: [],
        },
        aggregate_3: {
          type: 'task',
          id: 'aggregate_3',
          title: 'Aggregate',
          icon: 'aggregate',
          description: 'Simple Aggregate Activity',
          homepage:
            'https://github.com/project-flogo/stream/tree/master/activity/aggregate',
          features: {
            selectable: true,
            canHaveChildren: true,
            canBranch: true,
            deletable: true,
            subflow: false,
            final: false,
          },
          status: {
            invalid: false,
            executed: false,
            executionErrored: null,
            iterable: false,
          },
          children: ['inference_4'],
          parents: ['filter_2'],
        },
        inference_4: {
          type: 'task',
          id: 'inference_4',
          title: 'Invoke ML Model',
          icon: 'ml',
          description: 'Load factor predictor.',
          homepage: 'https://github.com/project-flogo/ml/tree/master/activity/inference',
          features: {
            selectable: true,
            canHaveChildren: true,
            canBranch: true,
            deletable: true,
            subflow: false,
            final: false,
          },
          status: {
            invalid: false,
            executed: false,
            executionErrored: null,
            iterable: false,
          },
          children: ['mqtt_5'],
          parents: ['aggregate_3'],
        },
        mqtt_5: {
          type: 'task',
          id: 'mqtt_5',
          title: 'Update Rules',
          icon: 'default',
          description: 'Update Rules',
          homepage:
            'https://github.com/project-flogo/edge-contrib/tree/master/activity/mqtt',
          features: {
            selectable: true,
            canHaveChildren: true,
            canBranch: true,
            deletable: true,
            subflow: false,
            final: false,
          },
          status: {
            invalid: false,
            executed: false,
            executionErrored: null,
            iterable: false,
          },
          children: [],
          parents: ['inference_4'],
        },
      },
    },
  };
}
