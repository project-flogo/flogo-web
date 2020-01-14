import { cloneDeep, isEmpty } from 'lodash';
import { takeUntil, switchMap, take, filter } from 'rxjs/operators';
import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  trigger as animationTrigger,
  transition,
  animateChild,
} from '@angular/animations';

import {
  SingleEmissionSubject,
  AppsService,
  StepFlowType,
} from '@flogo-web/lib-client/core';
import {
  ConfirmationResult,
  ConfirmationModalService,
} from '@flogo-web/lib-client/confirmation';
import { LanguageService } from '@flogo-web/lib-client/language';

import { NotificationsService } from '@flogo-web/lib-client/notifications';
import { TestRunnerService } from './core/test-runner/test-runner.service';

import {
  FlowData,
  Item,
  MetadataAttribute,
  FLOGO_TASK_TYPE,
  FlogoFlowService as FlowsService,
} from './core';
import { HandlerType, SelectionType, mergeItemWithSchema } from './core/models';
import { FlowActions, FlowState, FlowSelectors } from './core/state';
import { ParamsSchemaComponent } from './params-schema';
import { of } from 'rxjs';
import { ContribInstallerService } from '@flogo-web/lib-client/contrib-installer';
import { Store, select } from '@ngrx/store';
import { ModalService } from '@flogo-web/lib-client/modal';
import { taskIdsOfCurrentStep } from './core/test-runner/taskids-current-step';

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
  isOpen: boolean;
  SELECTOR_FOR_CURRENT_ELEMENT = 'flogo-diagram-tile-task.is-selected';
  @HostBinding('@initialAnimation') initialAnimation = true;
  flowState: FlowState;
  runnableInfo: {
    disabled: boolean;
    disableReason?: string;
  };

  _id: any;

  _isDiagramEdited: boolean;
  flowName: string;
  backToAppHover = false;

  app: any;
  isflowMenuOpen = false;

  triggerPosition = {
    left: '182px',
  };

  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(
    public translate: LanguageService,
    private _flowService: FlowsService,
    private _restAPIAppsService: AppsService,
    private _router: Router,
    private confirmationModalService: ConfirmationModalService,
    private _route: ActivatedRoute,
    private testRunner: TestRunnerService,
    private notifications: NotificationsService,
    private contribInstallerService: ContribInstallerService,
    private store: Store<FlowState>,
    private modalService: ModalService
  ) {
    this._isDiagramEdited = false;
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
    this.contribInstallerService.contribInstalled$
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(contribDetails =>
        this.store.dispatch(new FlowActions.ContributionInstalled(contribDetails))
      );
    this.store
      .pipe(
        select(FlowSelectors.selectDebugPanelOpen),
        takeUntil(this.ngOnDestroy$)
      )
      .subscribe(isOpen => {
        this.isOpen = isOpen;
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

  private changePanelState(isOpen: boolean) {
    this.store.dispatch(new FlowActions.DebugPanelStatusChange({ isOpen }));
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
        }),
        filter(result => result === ConfirmationResult.Confirm),
        switchMap(() => {
          return this.app
            ? of(this.app)
            : this._restAPIAppsService.getApp(this.flowState.app.id);
        })
      )
      .subscribe(app => {
        const triggerDetails = this.getTriggerCurrentFlow(app, this.flowState.id);
        this._flowService
          .deleteFlow(this.flowId)
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
      });
  }

  onDeleteTask(taskDetails) {
    this._deleteTaskFromDiagram(taskDetails.handlerType, taskDetails.itemId);
  }

  private initFlowData(flowData: FlowData) {
    this.flowName = flowData.flow.name;
  }

  private getCurrentRunStateForTask(taskID: string) {
    const steps = this.testRunner.getCurrentRunState().steps || [];
    return steps.find(step => {
      const mainFlowChanges = step.flowChanges[StepFlowType.MainFlow];
      const taskIdsExecuted = taskIdsOfCurrentStep(mainFlowChanges.tasks);
      // @ts-ignore:disable-legacy-type-interference
      return taskIdsExecuted.find(stepTaskId => stepTaskId === taskID);
    });
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
    const oldDescription = this.flowState.description;
    this.flowState.description = $event;
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
      .catch(() => {
        this.flowState.description = oldDescription;
        return this.notifications.error({
          key: 'CANVAS:ERROR-MESSAGE-UPDATE',
          params: { value: property },
        });
      });
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
    this.modalService
      .openModal<any>(ParamsSchemaComponent, this.flowState.metadata)
      .result.subscribe((paramsSchemaData?) => {
        if (paramsSchemaData && paramsSchemaData.action === 'save') {
          this._flowService.currentFlowDetails.updateMetadata(paramsSchemaData.metadata);
        }
      });
  }

  onRunFlow(modifiedInputs: MetadataAttribute[]) {
    let flowUpdatePromise;
    if (modifiedInputs.length) {
      // TODO: when re-enabling test runner make sure the update for metadata happens through store/action
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
}
