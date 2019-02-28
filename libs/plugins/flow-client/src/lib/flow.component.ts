import { cloneDeep, filter as _filter, get, isEmpty, pick, isEqual } from 'lodash';
import { takeUntil, switchMap, take, filter } from 'rxjs/operators';
import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  trigger as animationTrigger,
  transition,
  animateChild,
} from '@angular/animations';

import {
  MetadataAttribute,
  Task,
  LanguageService,
  Item,
  ConfirmationResult,
  ConfirmationModalService,
  FLOGO_TASK_TYPE,
  mergeItemWithSchema,
  SingleEmissionSubject,
} from '@flogo-web/client-core';
import { isMapperActivity } from '@flogo-web/plugins/flow-core';
import { NotificationsService } from '@flogo-web/client-core/notifications';
import { AppsApiService, RESTAPIHandlersService } from '@flogo-web/client-core/services';

import { TestRunnerService } from './core/test-runner/test-runner.service';
import { MonacoEditorLoaderService } from './shared/monaco-editor';

import { FlowData, Trigger } from './core';
import { FlogoFlowService as FlowsService } from './core/flow.service';
import { HandlerType, SelectionType } from './core/models';
import { FlowState } from './core/state';
import { FlowMetadata } from './task-configurator/models';
import { ParamsSchemaComponent } from './params-schema';

interface TaskContext {
  isTrigger: boolean;
  isBranch: boolean;
  isTask: boolean;
  shouldSkipTaskConfigure: boolean;
  flowRunDisabled: boolean;
  hasProcess: boolean;
  isDiagramEdited: boolean;
  app: any;
  currentTrigger: any;
}

@Component({
  selector: 'flogo-flow',
  providers: [TestRunnerService],
  templateUrl: 'flow.component.html',
  styleUrls: ['flow.component.less'],
  animations: [
    animationTrigger('initialAnimation', [transition('void => *', animateChild())]),
  ],
})
export class FlowComponent implements OnInit, OnDestroy {
  @HostBinding('@initialAnimation') initialAnimation = true;
  @ViewChild('inputSchemaModal') defineInputSchema: ParamsSchemaComponent;
  public flowState: FlowState;
  public triggersList: Trigger[];
  public runnableInfo: {
    disabled: boolean;
    disableReason?: string;
  };

  _id: any;

  _isDiagramEdited: boolean;
  flowName: string;
  backToAppHover = false;

  @HostBinding('hidden') loading: boolean;
  public hasTrigger: boolean;
  public currentTrigger: any;
  public app: any;
  public isflowMenuOpen = false;

  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(
    public translate: LanguageService,
    private _flowService: FlowsService,
    private _restAPIHandlerService: RESTAPIHandlersService,
    private _restAPIAppsService: AppsApiService,
    private _router: Router,
    private confirmationModalService: ConfirmationModalService,
    private _route: ActivatedRoute,
    private testRunner: TestRunnerService,
    private notifications: NotificationsService,
    private monacoLoaderService: MonacoEditorLoaderService
  ) {
    this._isDiagramEdited = false;

    this.loading = true;
    this.hasTrigger = true;
    this.currentTrigger = null;
    this.app = null;
  }

  get flowId() {
    return this.flowState && this.flowState.id;
  }

  public ngOnInit() {
    const flowData: FlowData = this._route.snapshot.data['flowData'];
    this._flowService.currentFlowDetails.flowState$
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(flowState => this.onFlowStateUpdate(flowState));
    this.initFlowData(flowData);
    this._flowService.currentFlowDetails.runnableState$
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(runnableState => (this.runnableInfo = runnableState));
    this.monacoLoaderService.isMonacoLoaded
      .pipe(
        filter(Boolean),
        take(1),
        takeUntil(this.ngOnDestroy$)
      )
      .subscribe(loaded => {
        if (loaded) {
          this.loading = false;
        }
      });
  }

  toggleFlowMenu() {
    this.isflowMenuOpen = !this.isflowMenuOpen;
  }

  closeFlowMenu() {
    this.isflowMenuOpen = false;
  }

  private onFlowStateUpdate(nextState: FlowState) {
    const prevState = this.flowState;
    this.flowState = nextState;
  }

  ngOnDestroy() {
    this.ngOnDestroy$.emitAndComplete();
  }

  deleteFlow() {
    this.closeFlowMenu();
    this.translate
      .get(['FLOWS:CONFIRM_DELETE', 'MODAL:CONFIRM-DELETION'], {
        flowName: this.flowState.name,
      })
      .pipe(
        switchMap(translation => {
          return this.confirmationModalService.openModal({
            title: translation['MODAL:CONFIRM-DELETION'],
            textMessage: translation['FLOWS:CONFIRM_DELETE'],
          }).result;
        })
      )
      .subscribe(result => {
        if (result === ConfirmationResult.Confirm) {
          const appPromise = this.app
            ? Promise.resolve(this.app)
            : this._restAPIAppsService.getApp(this.flowState.app.id);
          appPromise
            .then(app => {
              const triggerDetails = this.getTriggerCurrentFlow(app, this.flowState.id);
              return this._flowService.deleteFlow(
                this.flowId,
                triggerDetails ? triggerDetails.id : null
              );
            })
            .then(() => this.navigateToApp())
            .then(() =>
              this.notifications.success({
                key: 'FLOWS:SUCCESS-MESSAGE-FLOW-DELETED',
              })
            )
            .catch(err => {
              console.error(err);
              this.notifications.error({
                key: 'FLOWS:ERROR-MESSAGE-REMOVE-FLOW',
                params: err,
              });
            });
        }
      });
  }

  onDeleteTask(taskDetails) {
    this._deleteTaskFromDiagram(taskDetails.handlerType, taskDetails.itemId);
  }

  private initFlowData(flowData: FlowData) {
    this.flowName = flowData.flow.name;
    this.triggersList = flowData.triggers;
  }

  private getCurrentRunStateForTask(taskID: string) {
    const steps = this.testRunner.getCurrentRunState().steps || [];
    // allow double equal check for legacy ids that were type number
    /* tslint:disable-next-line:triple-equals */
    return steps.find(step => taskID == step.taskId);
  }

  private _getCurrentTaskContext(taskId: any): TaskContext {
    const handlerId = this.getDiagramId(taskId);
    const taskType = this.getTaskInHandler(handlerId, taskId).type;
    return {
      isTrigger: false, // taskType === FLOGO_TASK_TYPE.TASK_ROOT,
      isBranch: taskType === FLOGO_TASK_TYPE.TASK_BRANCH,
      isTask:
        taskType === FLOGO_TASK_TYPE.TASK || taskType === FLOGO_TASK_TYPE.TASK_SUB_PROC,
      shouldSkipTaskConfigure: taskType !== FLOGO_TASK_TYPE.TASK_BRANCH,
      // can't run from tile anymore in this panel, hardcoding to false until we remove the right panel
      hasProcess: false,
      flowRunDisabled: this.runnableInfo && this.runnableInfo.disabled,
      isDiagramEdited: this._isDiagramEdited,
      app: null,
      currentTrigger: null,
    };
  }

  private getItemsByHandlerId(id: string) {
    return id === HandlerType.Main ? this.flowState.mainItems : this.flowState.errorItems;
  }

  private getTaskInHandler(handlerId: string, taskId: string) {
    return this.getItemsByHandlerId(handlerId)[taskId];
  }

  /*-------------------------------*
   |       DESIGN FLOW              |
   *-------------------------------*/

  public changeFlowDetail($event, property) {
    return this._updateFlow()
      .then(wasSaved => {
        if (wasSaved) {
          this.notifications.success({
            key: 'CANVAS:SUCCESS-MESSAGE-UPDATE',
            params: { value: property },
          });
        }
        return wasSaved;
      })
      .catch(() =>
        this.notifications.error({
          key: 'CANVAS:ERROR-MESSAGE-UPDATE',
          params: { value: property },
        })
      );
  }

  /**
   * @deprecated state should be updated instead but supporting this for now for old modules
   */
  private _updateFlow() {
    return this._flowService.saveFlowIfChanged(this.flowId, this.flowState).toPromise();
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
                key: 'CANVAS:SUCCESS-MESSAGE-UPDATE',
                params: { value: property },
              });
              this.flowName = this.flowState.name;
              return response;
            })
            .catch(err => {
              this.notifications.error({
                key: 'CANVAS:ERROR-MESSAGE-UPDATE',
                params: { value: property },
              });
              return Promise.reject(err);
            });
        }
      })
      .catch(err => {
        this.notifications.error({
          key: 'CANVAS:ERROR-MESSAGE-UPDATE',
          params: { value: property },
        });
        return Promise.reject(err);
      });
  }

  private getTriggerCurrentFlow(app, flowId) {
    let trigger: any = null;
    const triggersForCurrentApp = app.triggers.filter(t => t.appId === app.id);

    // todo: unnecessary, app.triggers.filter is true?
    if (triggersForCurrentApp) {
      triggersForCurrentApp.forEach(currentTrigger => {
        const handlers = currentTrigger.handlers.find(handler => {
          return handler.resourceId === flowId;
        });

        if (handlers) {
          trigger = currentTrigger;
          return trigger;
        }
      });
    }
    return trigger;
  }

  private _selectTaskFromDiagram(taskId: string) {
    const handlerId = this.getDiagramId(taskId);

    // Refresh task detail
    const currentStep = this.getCurrentRunStateForTask(taskId);
    const context = this._getCurrentTaskContext(taskId);

    const currentItem = <Item>cloneDeep(this.getTaskInHandler(handlerId, taskId));
    let currentTask;
    if (currentItem.type === FLOGO_TASK_TYPE.TASK_BRANCH) {
      currentTask = cloneDeep(currentItem);
    } else {
      // schema == {} for subflow case
      const activitySchema = this.flowState.schemas[currentItem.ref] || <any>{};
      currentTask = mergeItemWithSchema(currentItem, activitySchema);
    }
  }

  private findItemById(taskId: string) {
    return this.getTaskInHandler(this.getDiagramId(taskId), taskId);
  }

  private _deleteTaskFromDiagram(handlerType: HandlerType, taskId: string) {
    const task = this.findItemById(taskId);
    if (!task) {
      return;
    }
    this.translate
      .get(['FLOW:CONFIRM-TASK-DELETE', 'MODAL:CONFIRM-DELETION'])
      .pipe(
        switchMap(translation => {
          return this.confirmationModalService.openModal({
            title: translation['MODAL:CONFIRM-DELETION'],
            textMessage: translation['FLOW:CONFIRM-TASK-DELETE'],
          }).result;
        })
      )
      .subscribe(result => {
        if (!result) {
          return;
        }
        if (result === ConfirmationResult.Confirm) {
          this._isDiagramEdited = true;
          this._flowService.currentFlowDetails.removeItem(handlerType, taskId);
        }
      });
  }

  private _getAllTasks() {
    return { ...this.flowState.mainItems, ...this.flowState.errorItems };
  }

  /*-------------------------------*
   |      APP NAVIGATION           |
   *-------------------------------*/

  public navigateToApp() {
    this._router.navigate(['/apps', this.flowState.appId]);
  }

  public onMouseOverBackControl() {
    this.backToAppHover = true;
  }

  public onMouseOutBackControl() {
    this.backToAppHover = false;
  }

  public openInputSchemaModal() {
    this.defineInputSchema.openInputSchemaModel();
  }

  onRunFlow(modifiedInputs: MetadataAttribute[]) {
    let flowUpdatePromise;
    if (modifiedInputs.length) {
      this.flowState.metadata.input = modifiedInputs;
      flowUpdatePromise = this._updateFlow();
    } else {
      flowUpdatePromise = Promise.resolve(this.flowState);
    }
    flowUpdatePromise
      .then(() => this.testRunner.runFromRoot().toPromise())
      .then(() => this.refreshCurrentSelectedTaskIfNeeded());
  }

  private refreshCurrentSelectedTaskIfNeeded() {
    const currentSelection = this.flowState.currentSelection;
    if (!currentSelection || currentSelection.type !== SelectionType.Task) {
      return;
    }
    const taskId = currentSelection.taskId;
    const diagramId = this.getDiagramId(taskId);
    if (diagramId) {
      this._selectTaskFromDiagram(taskId);
    }
  }

  private getDiagramId(taskId: string): string {
    if (this.getTaskInHandler(HandlerType.Main, taskId)) {
      return HandlerType.Main;
    } else if (this.getTaskInHandler(HandlerType.Error, taskId)) {
      return HandlerType.Error;
    }
    // todo: throw error?
    return null;
  }

  public onFlowSchemaSave(newMetadata: FlowMetadata) {
    this.flowState.metadata.input = this.mergeFlowInputMetadata(newMetadata.input);
    this.flowState.metadata.output = newMetadata.output;

    const getAllProps = from => from.map(o => o.name);
    const outputNames = getAllProps(newMetadata.output);
    const inputNames = getAllProps(newMetadata.input);
    this.cleanDanglingTaskOutputMappings(outputNames);

    this.cleanDanglingTriggerMappingsToFlow(inputNames);
    this._updateFlow();
  }

  private mergeFlowInputMetadata(
    inputMetadata: MetadataAttribute[]
  ): MetadataAttribute[] {
    return inputMetadata.map(input => {
      const existingInput = this.flowState.metadata.input.find(
        i => i.name === input.name && i.type === input.type
      );
      if (existingInput) {
        input.value = existingInput.value;
      }
      return input;
    });
  }

  // when flow schema's input change we need to remove the trigger mappings that were referencing them
  private cleanDanglingTriggerMappingsToFlow(inputNames: string[]) {
    const handlersToUpdate = this.triggersList.reduce((result, trigger) => {
      const handlersToUpdateInTrigger = trigger.handlers
        .filter(handler => handler.resourceId === this.flowId)
        .reduce(reduceToUpdatableHandlers, [])
        .map(handler => ({ handler, triggerId: trigger.id }));
      return result.concat(handlersToUpdateInTrigger);
    }, []);
    if (handlersToUpdate.length > 0) {
      return Promise.all(
        handlersToUpdate.map(({ handler, triggerId }) => {
          return this._restAPIHandlerService.updateHandler(
            triggerId,
            this.flowId,
            handler
          );
        })
      );
    }
    return Promise.resolve();

    function reduceToUpdatableHandlers(result, handler) {
      const actionInputMappings = get(handler, 'actionMappings.input', {});
      const applicableMappings = pick(actionInputMappings, inputNames);
      if (isEqual(applicableMappings, actionInputMappings)) {
        handler.actionMappings.input = applicableMappings;
        result.push(handler);
      }
      return result;
    }
  }

  // when flow schema's output change we need to remove the task mappings that were referencing them
  private cleanDanglingTaskOutputMappings(outputNames: string[]) {
    const isMapperContribAndHasMapping = (task: Task) => {
      const schema = this.flowState.schemas[task.ref];
      return isMapperActivity(schema) && !isEmpty(task.inputMappings);
    };
    _filter(this._getAllTasks(), isMapperContribAndHasMapping).forEach((task: Task) => {
      task.inputMappings = pick(task.inputMappings, outputNames);
    });
  }
}
