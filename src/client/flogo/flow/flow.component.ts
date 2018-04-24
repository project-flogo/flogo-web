import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';

import {
  MetadataAttribute,
  FlowDiagram,
  Task,
  UiFlow,
  LanguageService,
  ActivitySchema,
  ItemTask,
  Item,
  ItemSubflow,
  ItemBranch
} from '@flogo/core';
import { TriggersApiService, OperationalError } from '@flogo/core/services';
import { PostService } from '@flogo/core/services/post.service';
import { ValueType } from '@flogo/core/constants';

import { FlogoModal } from '@flogo/core/services/modal.service';
import { FlogoProfileService } from '@flogo/core/services/profile.service';

import {
  ERRORS as RUNNER_ERRORS,
  RunStateCode as RUNNER_STATE,
  RunStatusCode as RUNNER_STATUS,
  RunnerService,
  RunOptions,
  RunProgress,
  RunProgressStore,
  Step
} from './core/runner.service';
import { FlowData } from './core';

import { FlowMetadata } from './task-configurator/models/flow-metadata';

import {
  PUB_EVENTS as FLOGO_DIAGRAM_SUB_EVENTS,
  SUB_EVENTS as FLOGO_DIAGRAM_PUB_EVENTS
} from './shared/diagram/messages';
import {
  PUB_EVENTS as FLOGO_ADD_TASKS_SUB_EVENTS,
  SUB_EVENTS as FLOGO_ADD_TASKS_PUB_EVENTS
} from './task-add/messages';
import { SUB_EVENTS as FLOGO_SELECT_TASKS_PUB_EVENTS } from './task-detail/messages';
import {
  PUB_EVENTS as FLOGO_TASK_SUB_EVENTS,
  SUB_EVENTS as FLOGO_TASK_PUB_EVENTS
} from './shared/form-builder/messages';
import {
  PUB_EVENTS as FLOGO_TRANSFORM_SUB_EVENTS,
  SelectTaskConfigEventData,
  SUB_EVENTS as FLOGO_TRANSFORM_PUB_EVENTS
} from './task-configurator/messages';
import {
  PUB_EVENTS as FLOGO_ERROR_PANEL_SUB_EVENTS,
  SUB_EVENTS as FLOGO_ERROR_PANEL_PUB_EVENTS
} from './error-panel/messages';

import { AppsApiService } from '../core/services/restapi/v2/apps-api.service';
import { RESTAPIHandlersService } from '../core/services/restapi/v2/handlers-api.service';
import {
  FLOGO_FLOW_DIAGRAM_NODE_TYPE,
  FLOGO_PROFILE_TYPE,
  FLOGO_TASK_TYPE
} from '../core/constants';
import {
  flogoGenBranchID,
  isIterableTask,
  isMapperActivity,
  isSubflowTask,
  normalizeTaskName,
  notification,
  objectFromArray
} from '@flogo/shared/utils';

import { HandlerInfo } from '@flogo/core';

import { FlogoFlowService as FlowsService } from './core/flow.service';
import { IFlogoTrigger } from './triggers/models';
import { ParamsSchemaComponent } from './params-schema/params-schema.component';
import { updateBranchNodesRunStatus } from './shared/diagram/utils';
import { SaveTaskConfigEventData } from './task-configurator';
import { makeDefaultErrorTrigger } from '@flogo/flow/shared/diagram/models/task.model';
import { mergeItemWithSchema, extractItemInputsFromTask } from '@flogo/core/models';

export interface IPropsToUpdateFormBuilder {
  name: string;
}

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
  profileType: FLOGO_PROFILE_TYPE;
}

const FLOW_HANDLER_TYPE_ROOT = 'root';
const FLOW_HANDLER_TYPE_ERROR = 'errorHandler';

@Component({
  selector: 'flogo-flow',
  templateUrl: 'flow.component.html',
  styleUrls: ['flow.component.less']
})

export class FlowComponent implements OnInit, OnDestroy {
  @ViewChild('inputSchemaModal') defineInputSchema: ParamsSchemaComponent;
  public flow: UiFlow;
  public mainHandler: HandlerInfo;
  public errorHandler: HandlerInfo;
  public handlers: { [id: string]: HandlerInfo };
  public triggersList: IFlogoTrigger[];
  public runnableInfo: {
    disabled: boolean;
    disableReason?: string;
  };

  private runState = {
    // data
    currentProcessId: <string> null,
    processInstanceId: <string> null,
    // TODO: may need better implementation
    lastProcessInstanceFromBeginning: <any> null,
    steps: <Step[]> null,
  };

  _subscriptions: any[];
  _id: any;

  _isCurrentProcessDirty = true;
  _isDiagramEdited: boolean;
  flowName: string;
  backToAppHover = false;

  profileType: FLOGO_PROFILE_TYPE;
  PROFILE_TYPES: typeof FLOGO_PROFILE_TYPE = FLOGO_PROFILE_TYPE;

  public loading: boolean;
  public hasTrigger: boolean;
  public hasTask: boolean;
  public currentTrigger: any;
  public app: any;

  constructor(public translate: LanguageService,
              private _postService: PostService,
              private _flowService: FlowsService,
              private triggersApiService: TriggersApiService,
              private _restAPIHandlerService: RESTAPIHandlersService,
              private _restAPIAppsService: AppsApiService,
              private _runnerService: RunnerService,
              private _router: Router,
              private _flogoModal: FlogoModal,
              private profileService: FlogoProfileService,
              private _route: ActivatedRoute) {
    this._isDiagramEdited = false;

    this.loading = true;
    this.hasTrigger = true;
    this.hasTask = true;
    this.currentTrigger = null;
    this.app = null;
  }

  get flowId() {
    return this._flowService.currentFlowDetails.id;
  }

  public ngOnInit() {
    const flowData: FlowData = this._route.snapshot.data['flowData'];
    this.initFlowData(flowData);
    this.initSubscribe();
    this.loading = false;
  }

  private initSubscribe() {
    this._subscriptions = [];

    const subs = [
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.addTask, { callback: this._addTaskFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectTask, { callback: this._selectTaskFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.deleteTask, { callback: this._deleteTaskFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.addBranch, { callback: this._addBranchFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectBranch, { callback: this._selectBranchFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectConfigureTask, { callback: this._selectConfigureTaskFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectTrigger, { callback: this._selectTriggerFromDiagram.bind(this) }),
      _.assign({}, FLOGO_ADD_TASKS_SUB_EVENTS.addTask, { callback: this._addTaskFromTasks.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.runFromThisTile, { callback: this._runFromThisTile.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.runFromTrigger, { callback: this._runFromTriggerinTile.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.setTaskWarnings, { callback: this._setTaskWarnings.bind(this) }),
      _.assign({}, FLOGO_TRANSFORM_SUB_EVENTS.saveTask, { callback: this._saveConfigFromTaskConfigurator.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.taskDetailsChanged, { callback: this._taskDetailsChanged.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.changeTileDetail, { callback: this._changeTileDetail.bind(this) }),
      _.assign({}, FLOGO_ERROR_PANEL_SUB_EVENTS.openPanel, { callback: this._errorPanelStatusChanged.bind(this, true) }),
      _.assign({}, FLOGO_ERROR_PANEL_SUB_EVENTS.closePanel, { callback: this._errorPanelStatusChanged.bind(this, false) })
    ];

    _.each(
      subs, sub => {
        this._subscriptions.push(this._postService.subscribe(sub));
      }
    );
  }

  ngOnDestroy() {
    _.each(this._subscriptions, sub => {
        this._postService.unsubscribe(sub);
      }
    );
  }

  deleteFlow() {
    this.translate.get('FLOWS:CONFIRM_DELETE', { flowName: this.flow.name })
      .toPromise()
      .then(deleteMessage => this._flogoModal.confirmDelete(deleteMessage))
      .then((res) => {
        if (res) {
          let appPromise = null;
          appPromise = (this.app) ? Promise.resolve(this.app) : this._restAPIAppsService.getApp(this.flow.app.id);
          appPromise
            .then((app) => {
              const triggerDetails = this.getTriggerCurrentFlow(app, this.flow.id);
              return this._flowService.deleteFlow(this.flowId, triggerDetails ? triggerDetails.id : null);
            })
            .then(() => {
              this.navigateToApp();
            })
            .then(() => this.translate.get('FLOWS:SUCCESS-MESSAGE-FLOW-DELETED').toPromise())
            .then(message => notification(message, 'success', 3000))
            .catch(err => {
              console.error(err);
              this.translate.get('FLOWS:ERROR-MESSAGE-REMOVE-FLOW', err)
                .subscribe(message =>  notification(message, 'error'));
            });
        }
      });
  }

  private refreshCurrentTileContextIfNeeded() {
    const taskInfo = this.getCurrentTaskInfoFromRoute();
    if (!taskInfo) {
      return;
    }
    const { taskId, diagramId } = taskInfo;
    const context = this._getCurrentTaskContext(taskId, diagramId);
    this._postService.publish(Object.assign(
      {},
      FLOGO_SELECT_TASKS_PUB_EVENTS.taskContextUpdated,
      { data: { taskId, context } }
      ));
  }

  private getCurrentTaskInfoFromRoute() {
    const rootSnapshot = this._router.routerState.snapshot.root;
    const thisRoute = rootSnapshot.firstChild;
    if (!thisRoute && thisRoute.url[0].path !== 'flows') {
      // not on this route
      return null;
    }
    const childRoute = thisRoute.firstChild;
    if (!childRoute) {
      return null;
    }
    const [taskSegment, taskIdSegment] = childRoute.url;
    if (!taskSegment || taskSegment.path !== 'task') {
      return null;
    }
    const taskId = taskIdSegment.path;
    let diagramId;
    if (this.handlers[FLOW_HANDLER_TYPE_ROOT].tasks[taskId]) {
      diagramId = FLOW_HANDLER_TYPE_ROOT;
    } else if (this.handlers[FLOW_HANDLER_TYPE_ERROR].tasks[taskId]) {
      diagramId = FLOW_HANDLER_TYPE_ERROR;
    } else {
      return null;
    }
    return { diagramId, taskId };
  }

  public _updateFlow(flow: any) {
    this._isCurrentProcessDirty = true;

    function cleanPaths(paths: any) {
      _.each(_.keys(paths), key => {
        if (key !== 'root' && key !== 'nodes') {
          delete paths[key];
        }
      });
    }

    // processing this._flow to pure JSON object
    flow = _.cloneDeep(flow);
    cleanPaths(flow.paths);
    flow.schemas = _.get(this.handlers, 'root.schemas');

    if (flow.errorHandler && !_.isEmpty(flow.errorHandler.paths)) {
      cleanPaths(flow.errorHandler.paths);
    }

    this.determineRunnableEnabled();
    return this._flowService.saveFlow(this.flowId, flow).then(rsp => {
      if (_.isEmpty(flow.items)) {
        this.hasTask = false;
      }
      console.groupCollapsed('Flow updated');
      console.log(rsp);
      console.groupEnd();
      return rsp;
    });

  }

  private initFlowData(flowData: FlowData) {
    this.flow = flowData.flow;
    this.flowName = this.flow.name;
    this.handlers = {
      [FLOW_HANDLER_TYPE_ROOT]: flowData.root,
      [FLOW_HANDLER_TYPE_ERROR]: flowData.errorHandler
    };

    this.mainHandler = this.handlers[FLOW_HANDLER_TYPE_ROOT];
    this.errorHandler = this.handlers[FLOW_HANDLER_TYPE_ERROR];
    if (_.isEmpty(this.mainHandler.tasks)) {
      this.hasTask = false;
    }
    this.triggersList = flowData.triggers;

    this.clearAllHandlersRunStatus();
    this.determineRunnableEnabled();
    // todo: move to resolver?
    this.profileService.initializeProfile(this.flow.app);
    this.profileType = this.profileService.currentApplicationProfile;
  }

  private _getCurrentState(taskID: string) {
    const steps = this.runState.steps || [];
    // allow double equal check for legacy ids that were type number
    /* tslint:disable-next-line:triple-equals */
    return steps.find(step => taskID == step.taskId);
  }

  private _cleanSelectionStatus() {
    const allNodes = _.reduce(this.handlers, (nodesAccumulator, handle) => {
      return _.assign(
        nodesAccumulator,
        _.get(handle, 'diagram.nodesOfAddType', {}),
        _.get(handle, 'diagram.nodes', {})
      );
    }, {});
    _.forEach(allNodes, node => _.set(node, '__status.isSelected', false));

    this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
  }


  private _errorPanelStatusChanged(isOpened: boolean, data: any, envelope: any) {

    console.group('Close/open error panel from error panel');

    // clean selection status

    const allNodes = _.reduce(this.handlers, (nodesAccumulator, handle) => {
      return _.assign(nodesAccumulator,
        _.get(handle, 'diagram.nodesOfAddType', {}),
        _.get(handle, 'diagram.nodes',
          {})
      );
    }, {});
    _.forEach(allNodes, node => _.set(node, '__status.isSelected', false));

    this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);

    // clean selection status
    this._cleanSelectionStatus();

    this._navigateFromModuleRoot();

    console.groupEnd();

  }

  private uniqueTaskName(taskName: string) {
    // TODO for performance pre-normalize and store task names?
    const newNormalizedName = normalizeTaskName(taskName);

    // All activities are gathered in one variable
    const allTasks = _.reduce(this.handlers, (all: any, current: any) => _.assign(all, current.tasks), {});

    // search for the greatest index in all the flow
    const greatestIndex = _.reduce(allTasks, (greatest: number, task: any) => {
      const currentNormalized = normalizeTaskName(task.name);
      let repeatIndex = 0;
      if (newNormalizedName === currentNormalized) {
        repeatIndex = 1;
      } else {
        const match = /^(.*)\-([0-9]+)$/.exec(currentNormalized); // some-name-{{integer}}
        if (match && match[1] === newNormalizedName) {
          repeatIndex = _.toInteger(match[2]);
        }
      }

      return repeatIndex > greatest ? repeatIndex : greatest;

    }, 0);

    return greatestIndex > 0 ? `${taskName} (${greatestIndex + 1})` : taskName;
  }

  private _getCurrentTaskContext(taskId: any, diagramId: string): TaskContext {
    const taskType = this.handlers[diagramId].tasks[taskId].type;
    return {
      isTrigger: false, // taskType === FLOGO_TASK_TYPE.TASK_ROOT,
      isBranch: taskType === FLOGO_TASK_TYPE.TASK_BRANCH,
      isTask: taskType === FLOGO_TASK_TYPE.TASK || taskType === FLOGO_TASK_TYPE.TASK_SUB_PROC,
      shouldSkipTaskConfigure: this.isTaskSubflowOrMapper(taskId, diagramId),
      flowRunDisabled: this.runnableInfo && this.runnableInfo.disabled,
      hasProcess: Boolean(this.runState.currentProcessId),
      isDiagramEdited: this._isDiagramEdited,
      app: null,
      currentTrigger: null,
      profileType: this.profileType
    };
  }

  private isTaskSubflowOrMapper(taskId: any, diagramId: string): boolean {
    const currentTask = <ItemTask> this.handlers[diagramId].tasks[taskId];
    const activitySchema = this.flow.schemas[currentTask.ref];
    return isSubflowTask(currentTask.type) || isMapperActivity(activitySchema);
  }

  /**
   *
   * @param urlParts empty to navigate to module root
   * @returns {Promise<boolean>}
   * @private
   */
  private _navigateFromModuleRoot(urlParts = []) {
    return this._router.navigate(['/flows', this.flowId, ...urlParts]);
  }

  /*-------------------------------*
   |       DESIGN FLOW              |
   *-------------------------------*/

  public changeFlowDetail($event, property) {
    return new Promise((resolve, reject) => {
      this._updateFlow(this.flow).then((response: any) => {
        const message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-UPDATE', { value: property });
        notification(message, 'success', 3000);
        resolve(response);
      }).catch((err) => {
        const message = this.translate.instant('CANVAS:ERROR-MESSAGE-UPDATE', { value: property });
        notification(message, 'error');
        reject(err);
      });
    });

  }

  public changeFlowDetailName(name, property) {
    if (name === this.flowName) {
      return Promise.resolve(true);
    }

    return this._flowService.listFlowsByName(this.flow.appId, name)
      .then((flows) => {
        const results = flows || [];
        if (!_.isEmpty(results)) {
          if (results[0].id === this.flowId) {
            return;
          }
          const message = this.translate.instant('CANVAS:FLOW-NAME-EXISTS', { value: name });
          this.flow.name = this.flowName;
          notification(message, 'error');
          return results;
        } else {
          this.flow.name = name;
          this._updateFlow(this.flow).then((response: any) => {
            const message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-UPDATE', { value: property });
            this.flowName = this.flow.name;
            notification(message, 'success', 3000);
            return response;
          }).catch((err) => {
            const message = this.translate.instant('CANVAS:ERROR-MESSAGE-UPDATE', { value: property });
            notification(message, 'error');
            return Promise.reject(err);
          });
        }
      })
      .catch((err) => {
        const message = this.translate.instant('CANVAS:ERROR-MESSAGE-UPDATE', { value: property });
        notification(message, 'error');
        return Promise.reject(err);
      });
  }

  private _addTaskFromDiagram(data: any, envelope: any) {
    console.group('Add task message from diagram');

    console.log(data);
    console.log(envelope);

    this._navigateFromModuleRoot(['task', 'add'])
      .then(
        () => {
          console.group('after navigation');

          this._postService.publish(
            _.assign(
              {}, FLOGO_ADD_TASKS_PUB_EVENTS.addTask, {
                data: data
              }
            )
          );

          console.groupEnd();
        });

    console.groupEnd();
  }

  private _addTaskFromTasks(data: any, envelope: any) {
    const diagramId: string = data.id;
    console.group('Add task message from task');

    console.log(data);
    console.log(envelope);

    const doRegisterTask = _registerTask.bind(this);
    doRegisterTask();
    function _registerTask() {
      let task = data.task;
      const taskName = this.uniqueTaskName(data.task.name);
      // generate task id when adding the task
      task = <Task> _.assign({},
        task,
        {
          id: this.profileService.generateTaskID(this._getAllTasks(), task),
          name: taskName
        });

      const handler = this.handlers[diagramId];
      if (!handler.tasks) {
        handler.tasks = {};
      }
      handler.tasks[task.id] = task;

      const schema = task.__schema;
      const isMapperTask = isMapperActivity(schema);
      const isSubFlowTask = isSubflowTask(data.task.type);
      if (!isSubFlowTask) {
        const rootHandler = this.handlers.root;
        rootHandler.schemas = rootHandler.schemas || {};
        task.ref = task.ref || schema.ref;
        rootHandler.schemas[task.ref] = schema;
        this.flow.schemas = Object.assign({}, this.flow.schemas, rootHandler.schemas);
        delete task['__schema'];
      }

      this._navigateFromModuleRoot()
        .then(
          () => {
            this._postService.publish(
              _.assign(
                {}, FLOGO_DIAGRAM_PUB_EVENTS.addTask, {
                  data: {
                    node: data.node,
                    task: task,
                    id: data.id
                  },
                  // todo: remove, this is a temporal solution to prevent auto opening a new tile
                  skipTaskAutoSelection: isMapperTask || isSubFlowTask,
                  done: (diagram: FlowDiagram) => {
                    _.assign(this.handlers[diagramId].diagram, diagram);
                    this._updateFlow(this.flow);
                    this._isDiagramEdited = true;
                    this.hasTask = true;
                    if (isMapperTask || isSubFlowTask) {
                      // todo: remove, this is a temporal solution to clear the diagram selection state
                      this._cleanSelectionStatus();
                    }
                  }
                }
              )
            );
          }
        );
    }

    console.groupEnd();

  }

  private getTriggerCurrentFlow(app, flowId) {
    let trigger: any = null;
    const triggersForCurrentApp = app.triggers.filter(t => t.appId === app.id);

    // todo: unnecessary, app.triggers.filter is true?
    if (triggersForCurrentApp) {
      triggersForCurrentApp.forEach((currentTrigger) => {
        const handlers = currentTrigger.handlers.find((handler) => {
          return handler.actionId === flowId;
        });

        if (handlers) {
          trigger = currentTrigger;
          return trigger;
        }
      });
    }
    return trigger;
  }


  private _selectTriggerFromDiagram(data: any, envelope: any) {
    const diagramId: string = data.id;
    console.group('Select trigger message from diagram');

    console.log(data);
    console.log(envelope);


    this._navigateFromModuleRoot(['task', data.node.taskID])
      .then(
        () => {
          console.group('after navigation');
          let appPromise = null;
          appPromise = (this.app) ? Promise.resolve(this.app) : this._restAPIAppsService.getApp(this.flow.app.id);

          appPromise
            .then((app) => {
              // Refresh task detail
              const currentStep = this._getCurrentState(data.node.taskID);
              const currentTask = this.handlers[diagramId].tasks[data.node.taskID];
              const context = this._getCurrentTaskContext(data.node.taskID, diagramId);

              if (!this.currentTrigger) {
                this.currentTrigger = this.getTriggerCurrentFlow(app, this.flow.id);
              }

              context.currentTrigger = this.currentTrigger;

              context.app = app;
              this.app = app;

              this._restAPIHandlerService.getHandler(this.currentTrigger.id, this.flow.id)
                .then((handler) => {
                  this._updateAttributesChanges(currentTask, handler.outputs, 'outputs');

                  this._postService.publish(
                    _.assign(
                      {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
                        data: _.assign({}, data,
                          { task: currentTask },
                          { step: currentStep },
                          { context: context }
                        ),
                        done: () => {
                          // select task done
                          //  only need this publish if the trigger has been changed
                          this._postService.publish(
                            _.assign(
                              {}, FLOGO_DIAGRAM_PUB_EVENTS.selectTrigger, {
                                data: {
                                  node: data.node,
                                  task: currentTask, // this.handlers[diagramId].tasks[data.node.taskID],
                                  id: data.id
                                },
                                done: (diagram: FlowDiagram) => {
                                  _.assign(this.handlers[diagramId].diagram, diagram);
                                  // this._updateFlow( this.flow ); // doesn't need to save if only selecting without any change
                                }
                              }
                            )
                          );

                        }
                      }
                    )
                  );

                });


              console.groupEnd();
            });


        }
      );


    console.groupEnd();
  }

  private _selectTaskFromDiagram(data: any, envelope: any) {
    const diagramId = data.id;

    console.group('Select task message from diagram');
    console.log(data);
    console.log(envelope);

    // Refresh task detail
    const currentStep = this._getCurrentState(data.node.taskID);
    const context = this._getCurrentTaskContext(data.node.taskID, diagramId);

    const currentItem = <ItemTask> _.cloneDeep(this.handlers[diagramId].tasks[data.node.taskID]);
    // schema == {} for subflow case
    const activitySchema = this.flow.schemas[currentItem.ref] || <any>{};
    const currentTask = mergeItemWithSchema(currentItem, activitySchema);

    this._navigateFromModuleRoot(['task', data.node.taskID])
      .then(
        () => {
          console.group('after navigation');
          this.openTaskDetail(diagramId, data, currentTask, currentStep, context);
          console.groupEnd();
        }
      );

    console.groupEnd();
  }

  private openTaskDetail(
    diagramId: string,
    data: any,
    currentTask: Task,
    currentStep: Step,
    context: TaskContext,
  ) {
    this._postService.publish(
      _.assign(
        {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
          data: _.assign({},
            data,
            { task: currentTask, step: currentStep, context }
          ),

          done: () => {
            // select task done
            this._postService.publish(
              _.assign(
                {}, FLOGO_DIAGRAM_PUB_EVENTS.selectTask, {
                  data: {
                    node: data.node,
                    task: this.handlers[diagramId].tasks[data.node.taskID],
                    id: diagramId
                  },
                  done: (diagram: FlowDiagram) => {
                    _.assign(this.handlers[diagramId].diagram, diagram);
                    // this._updateFlow( this.flow ); // doesn't need to save if only selecting without any change
                  }
                }
              )
            );

          }
        }
      )
    );
  }

  private _changeTileDetail(data: {
    content: string;
    proper: string;
    taskId: any,
    id: string,
    tileType: string
  }, envelope: any) {
    if (data.tileType === 'activity') {
      const task = <ItemTask> this.handlers[data.id].tasks[data.taskId];

      if (task) {
        if (data.proper === 'name') {
          task[data.proper] = this.uniqueTaskName(data.content);
        } else {
          task[data.proper] = data.content;
        }
        const updateObject = {};

        const propsToUpdateFormBuilder: IPropsToUpdateFormBuilder = <IPropsToUpdateFormBuilder> {};

        propsToUpdateFormBuilder.name = task.name;

        this._updateFlow(this.flow).then(() => {
          this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
          this._postService.publish(
            _.assign(
              {}, FLOGO_TASK_PUB_EVENTS.updatePropertiesToFormBuilder, {
                data: propsToUpdateFormBuilder
              }
            )
          );
        });

        // TODO: used?
        if (<any>task.type === FLOGO_TASK_TYPE.TASK_ROOT) {
          updateObject[data.proper] = task[data.proper];
          this.triggersApiService.updateTrigger(this.currentTrigger.id, updateObject);
        }


      }
    }
  }

  private _deleteTaskFromDiagram(data: any, envelope: any) {
    const diagramId: string = data.id;

    console.group('Delete task message from diagram');

    console.log(data);
    // data.id = this.flow._id;

    const task = this.handlers[diagramId].tasks[_.get(data, 'node.taskID', '')];
    const node = this.handlers[diagramId].diagram.nodes[_.get(data, 'node.id', '')];
    const _diagram = this.handlers[diagramId].diagram;

    // TODO
    //  refine confirmation
    //  delete trigger isn't hanlded
    if (task) {
      this._flogoModal.confirmDelete('Are you sure you want to delete this task?').then((res) => {
        if (res) {

          // clear details panel, if the selected activity is deleted
          // verify if should jump back to detail page before sending delete message
          let _shouldGoBack = false;
          const parsedURL = location.pathname.split('task/');
          if (parsedURL.length === 2 && _.isString(parsedURL[1])) {

            const currentTaskID = parsedURL[1];
            const deletingTaskID = _.get(data, 'node.taskID', '');

            // if the current task ID in the URL is the deleting task, or
            // if the deleting task has branches or itself is branch, and the current task is in one of the branches
            // navigate to the flow default view
            if (currentTaskID === deletingTaskID || // if the current task ID in the URL is the deleting task

              // if the deleting task has branches or itself is branch, and the current task is in one of the branches
              ((_.some(_.get(data, 'node.children', []), (nodeId: string) => {

                  // try to find children of NODE_BRANCH type
                  return _diagram.nodes[nodeId].type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH;

                }) || _.get(data, 'node.type') === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH)
                && (function isTaskIsChildOf(taskID: string, parentNode: any, isInBranch = false): boolean {

                  // traversal the downstream task
                  const children = _.get(parentNode, 'children', []);

                  if (parentNode.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH) {
                    isInBranch = true;
                  }

                  if (taskID === _.get(parentNode, 'taskID')) {
                    return isInBranch; // if in branch, then should go back, otherwise ignore
                  } else if (children.length === 0) { // no child
                    return false;
                  } else { // resursive call to the next level
                    return _.some(children, (childID: string) => {
                      return isTaskIsChildOf(taskID, _diagram.nodes[childID], isInBranch);
                    });
                  }

                }(currentTaskID, data.node)))) {
              _shouldGoBack = true;
            }
          }

          this._postService.publish(
            _.assign(
              {}, FLOGO_DIAGRAM_PUB_EVENTS.deleteTask, {
                data: {
                  node: data.node,
                  id: diagramId
                },
                done: (diagram: FlowDiagram) => {
                  // TODO
                  //  NOTE that once delete branch, not only single task is removed
                  const tasks = this.handlers[diagramId].tasks;
                  const deletedTask = <Item>_.cloneDeep(tasks[_.get(data, 'node.taskID', '')]);
                  delete tasks[_.get(data, 'node.taskID', '')];
                  _.assign(this.handlers[diagramId].diagram, diagram);
                  this._updateFlow(this.flow);
                  this._isDiagramEdited = true;

                  const isSubflowItem = (checkItem: Item): checkItem is ItemSubflow => isSubflowTask(checkItem.type);
                  if (isSubflowItem(deletedTask)) {
                    this.manageFlowRelationships(deletedTask.settings.flowPath);
                  }

                  if (_shouldGoBack) {
                    this._navigateFromModuleRoot();
                  }
                }
              }
            )
          );
        }
      }).catch((err) => {
        console.error(err);
      });
    }

    console.groupEnd();
  }

  private _addBranchFromDiagram(data: any, envelope: any) {
    const diagramId: string = data.id;

    console.group('Add branch message from diagram');
    console.log(data);

    // TODO
    //  remove this mock later
    //    here just creating a branch node with new branch info

    const branchInfo: ItemBranch = {
      id: flogoGenBranchID(),
      type: FLOGO_TASK_TYPE.TASK_BRANCH,
      condition: 'true'
    };

    this.handlers[diagramId].tasks[branchInfo.id] = branchInfo;

    this._postService.publish(_.assign({}, FLOGO_DIAGRAM_PUB_EVENTS.addBranch, {
      data: {
        node: data.node,
        task: branchInfo,
        id: diagramId
      },
      done: (diagram: FlowDiagram) => {
        _.assign(this.handlers[diagramId].diagram, diagram);
        this._updateFlow(this.flow);
      }
    }));

    console.groupEnd();
  }

  private _selectBranchFromDiagram(data: any, envelope: any) {
    const diagramId: string = data.id;
    console.group('Select branch message from diagram');

    console.log(data);

    // TODO
    //  reference to _selectTaskFromDiagram
    //  may need to route to some other URL?
    const currentStep = this._getCurrentState(data.node.taskID);
    const currentTask = _.assign({}, _.cloneDeep(this.handlers[diagramId].tasks[data.node.taskID]));
    const context = this._getCurrentTaskContext(data.node.taskID, diagramId);

    const selectedNode = data.node;
    const previousNodes = this.findPathToNode(this.handlers[diagramId].diagram.root.is, selectedNode.id, diagramId);
    previousNodes.pop(); // ignore last item as it is the very same selected node
    const previousTiles = this.mapNodesToTiles(previousNodes, this.handlers[diagramId]);


    this._navigateFromModuleRoot(['task', data.node.taskID])
      .then(
        () => {
          console.group('after navigation');

          this._postService.publish(
            _.assign(
              {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
                data: _.assign({},
                  data,
                  { task: currentTask },
                  { step: currentStep },
                  {
                    context: _.assign(context, {
                      contextData: {
                        previousTiles: previousTiles
                      }
                    })
                  }
                ),

                done: () => {
                  // select task done
                  this._postService.publish(
                    _.assign(
                      {}, FLOGO_DIAGRAM_PUB_EVENTS.selectTask, {
                        data: {
                          node: data.node,
                          task: this.handlers[diagramId].tasks[data.node.taskID]
                        },
                        done: (diagram: FlowDiagram) => {
                          _.assign(this.handlers[diagramId].diagram, diagram);
                          // this._updateFlow(this.flow);
                        }
                      }
                    )
                  );

                }
              }
            )
          );

          console.groupEnd();
        }
      );

    console.groupEnd();
  }

  private _taskDetailsChanged(data: any, envelope: any) {
    const diagramId = data.id;

    console.group('Save task details to flow');
    const task = this.handlers[diagramId].tasks[data.taskId];

    if (task.type === FLOGO_TASK_TYPE.TASK) {
      // set/unset the warnings in the tile
      _.set(task, '__props.warnings', data.warnings);
      const changedInputs = data.inputs || {};
      task.input = {...changedInputs};
    } else if (<any>task.type === FLOGO_TASK_TYPE.TASK_ROOT) { // trigger
      // todo: used?
      let updatePromise: any = Promise.resolve(true);

      if (data.changedStructure === 'settings') {
        updatePromise = this.triggersApiService.updateTrigger(this.currentTrigger.id, { settings: data.settings });
      } else if (data.changedStructure === 'endpointSettings' || data.changedStructure === 'outputs') {
        updatePromise = this._restAPIHandlerService.updateHandler(this.currentTrigger.id, this.flow.id, {
          settings: data.endpointSettings,
          outputs: data.outputs
        });

      }

      updatePromise
        .then((res) => {
          this._updateAttributesChanges(task, data.settings, 'settings');
          this._updateAttributesChanges(task, data.endpointSettings, 'endpoint.settings');
          this._updateAttributesChanges(task, data.outputs, 'outputs');

          // ensure the persence of the internal properties
          task.__props = task.__props || {};

          // cache the outputs mock of a trigger, to be used as initial data when start/restart the flow.
          task.__props['outputs'] = _.map(_.get(task, 'outputs', []), (output: any) => {
            const newValue = data.outputs[output.name];

            // undefined is invalid default value, hence filter that out.
            if (output && !_.isUndefined(newValue)) {
              output.value = newValue;
            }

            return output;
          });
        });


    } else if (task.type === FLOGO_TASK_TYPE.TASK_BRANCH) { // branch
      task.condition = data.condition;
    }

    if (_.isFunction(envelope.done)) {
      envelope.done();
    }

    this._updateFlow(this.flow).then(() => {
      this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
    });

    console.groupEnd();
  }

  private _updateAttributesChanges(task: any, changedInputs: any, structure: any) {
    const attributeNamePairs = _.get(task, structure, []).map(attr => <[string, any]>[attr.name, attr]);
    const attributesByName = new Map<string, any>(attributeNamePairs);
    Object.keys(changedInputs || {}).forEach(name => {
      const attribute = attributesByName.get(name);
      if (attribute) {
        attribute.value = changedInputs[name];
      }
    });
  }

  private _setTaskWarnings(data: any, envelope: any) {
    const diagramId = data.id;

    const task = this.handlers[diagramId].tasks[data.taskId];

    if (task) {
      _.set(task, '__props.warnings', data.warnings);

      this._updateFlow(this.flow).then(() => {
        this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
      });
    }

  }

  private _getAllTasks() {
    return _.assign({}, this.handlers['root'].tasks, this.handlers['errorHandler'].tasks);
  }

  /*-------------------------------*
   |      RUN FLOW                 |
   *-------------------------------*/

  /* TODO: Need to deprecate this method as it is no longer needed*/
  private _runFromTriggerinTile(data: any, envelope: any) {
    const diagramId: string = data.id;
    const currentDiagram: any = this.handlers[diagramId];

    console.group('Run from Trigger');

    this._runFromRoot().then((res) => {
      const currentStep = this._getCurrentState(data.taskId);
      const currentTask = _.assign({}, _.cloneDeep(currentDiagram.tasks[data.taskId]));
      const context = this._getCurrentTaskContext(data.taskId, diagramId);

      this._postService.publish(
        _.assign(
          {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
            data: _.assign({},
              data,
              { task: currentTask, step: currentStep, context }
            )
          }
        ));
    })
      .catch(
        (err: any) => {
          console.error(err);
          return err;
        }
      );

    console.groupEnd();
  }

  private _runFromRoot() {
    this._postService.publish(FLOGO_ERROR_PANEL_PUB_EVENTS.closePanel);

    this._isDiagramEdited = false;
    this.cleanDiagramRunState();
    this.markRootAsRan();

    // The initial data to start the process from trigger
    const initData = this.getInitDataForRoot();
    const runOptions: RunOptions = { attrsData: initData };
    const shouldUpdateFlow = this._isCurrentProcessDirty || !this.runState.currentProcessId;
    if (shouldUpdateFlow) {
      runOptions.useFlow = this.flow;
    } else {
      runOptions.useProcessId = this.runState.currentProcessId;
    }

    this.runState.steps = null;
    const runner = this._runnerService.runFromRoot(runOptions);

    runner.registered.subscribe(info => {
      this.runState.currentProcessId = info.processId;
      this.runState.processInstanceId = info.instanceId;
    }, _.noop); // TODO: remove when fixed https://github.com/ReactiveX/rxjs/issues/2180);

    return this.observeRunProgress(runner)
      .then((runState: RunProgress) => {
        this.runState.lastProcessInstanceFromBeginning = runState.lastInstance;
        return runState;
      })
      .catch(err => this.handleRunError(err));
  }


  // TODO
  //  to do proper restart process, need to select proper snapshot, hence
  //  the current implementation is only for the last start-from-beginning snapshot, i.e.
  //  the using this.runState.processInstanceId to restart
  private _runFromThisTile(data: any, envelope: any) {
    console.group('Run from this tile');

    const selectedTask = this.mainHandler.tasks[data.taskId];

    if (<any>selectedTask.type === FLOGO_TASK_TYPE.TASK_ROOT) {
      // todo: used?
      this._runFromTriggerinTile(data, envelope);
      return;
    } else if (!this.runState.processInstanceId) {
      // run from other than the trigger (root task);
      // TODO
      console.warn('Cannot find proper step to restart from, skipping...');
      return;
    }

    const step = this._getStepNumberFromSteps(data.taskId);

    if (!step) {
      // TODO
      //  handling the case that trying to start from the middle of a path without run from the trigger for the first time.
      const task = this.mainHandler.tasks[data.taskId];
      console.error(`Cannot start from task ${(<any>task).name} (${task.id})`);
      return;
    }

    const attrs = _.get(selectedTask, 'attributes.inputs');
    const dataOfInterceptor = {
      tasks: [{
        id: selectedTask.id,
        inputs: parseInput(attrs, data.inputs),
      }]
    };

    this.runState.steps = null;
    this.clearAllHandlersRunStatus();
    this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);

    const runner = this._runnerService.rerun({
      useFlow: this.flow,
      interceptor: dataOfInterceptor,
      step: step,
      instanceId: this.runState.processInstanceId,
    });

    this.observeRunProgress(runner)
      .then(() => {
        const currentStep = this._getCurrentState(data.taskId);
        const currentTask = _.assign({}, _.cloneDeep(this.mainHandler.tasks[data.taskId]));
        const context = this._getCurrentTaskContext(data.taskId, 'root');

        this._postService.publish(_.assign({},
          FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask,
          { data: _.assign({}, data, { context, task: currentTask, step: currentStep, }) })
        );

        if (_.isFunction(envelope.done)) {
          envelope.done();
        }

      })
      .catch(err => this.handleRunError(err));

    console.groupEnd();

    function parseInput(formAttrs: any, inputData: any) {
      if (!formAttrs) {
        return [];
      }
      return _.map(formAttrs, (input: any) => {
        // override the value;
        return _.assign(_.cloneDeep(input), {
          value: inputData[input.name],
          type: input.type
        });
      });
    }

  }

  // monitor the status of a process till it's done or up to the max trials
  private observeRunProgress(runner: RunProgressStore): Promise<RunProgress | void> {

    // TODO: remove noop when fixed https://github.com/ReactiveX/rxjs/issues/2180
    runner.processStatus
      .subscribe(processStatus => this.logRunStatus(processStatus), _.noop);

    // TODO: only on run from trigger?
    runner.registered.subscribe(info => {
      this._isCurrentProcessDirty = false;
    }, _.noop); // TODO: remove when fixed https://github.com/ReactiveX/rxjs/issues/2180);

    runner.steps
      .subscribe(steps => {
        if (steps) {
          this.runState.steps = steps;
          this.updateTaskRunStatus(steps, {});
        }
      }, _.noop); // TODO: remove when fixed https://github.com/ReactiveX/rxjs/issues/2180

    return runner.completed
      .do(state => {
        this.runState.steps = state.steps;
        const message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-COMPLETED');
        notification(message, 'success', 3000);
      })
      .toPromise();

  }

  private logRunStatus(processStatus) {
    switch (processStatus.status) {
      case RUNNER_STATUS.NotStarted:
        console.log(`[PROC STATE][${processStatus.trial}] Process has not started.`);
        break;
      case RUNNER_STATUS.Active:
        console.log(`[PROC STATE][${processStatus.trial}] Process is running...`);
        break;
      case RUNNER_STATUS.Completed:
        console.log(`[PROC STATE][${processStatus.trial}] Process finished.`);
        break;
      case null:
        break;
      default:
        console.warn(`[PROC STATE][${processStatus.trial}] Unknown status.`);
    }
  }

  private cleanDiagramRunState() {
    // clear task status and render the diagram
    this.clearAllHandlersRunStatus();
    this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
  }

  private markRootAsRan() {
    const mainHandler = this.mainHandler;
    try { // rootTask should be in DONE status once the flow start
      const rootTask = mainHandler.tasks[mainHandler.diagram.nodes[mainHandler.diagram.root.is].taskID];
      rootTask.__status['hasRun'] = true;
      rootTask.__status['isRunning'] = false;
    } catch (e) {
      console.warn(e);
      console.warn('No root task/trigger is found.');
    }
  }

  private getInitDataForRoot(): { name: string; type: string; value: any }[] {
    const flowInput = _.get(this.flow, 'metadata.input');
    if (_.isEmpty(flowInput)) {
      return undefined;
    }
    // preprocessing initial data
    return _(flowInput)
      .filter((item: any) => {
        // filter empty values
        return !_.isNil(item.value);
      })
      .map((item: any) => _.cloneDeep(item))
      .value();
  }

  private determineRunnableEnabled() {
    this.runnableInfo = {
      disabled: _.isEmpty(this.mainHandler && this.mainHandler.tasks),
      disableReason: null
    };
    if (this.runnableInfo.disabled) {
      return;
    }
    const allTasks = this._getAllTasks();
    const subflowOrIteratorTasks = Object.keys(allTasks).find(task => {
      return isSubflowTask(allTasks[task].type) || isIterableTask(allTasks[task]);
    });
    if (subflowOrIteratorTasks) {
      this.runnableInfo.disabled = true;
      this.runnableInfo.disableReason = this.translate.instant('CANVAS:WARNING-UNSUPPORTED-TEST-RUN');
    } else {
      this.runnableInfo.disabled = false;
      this.runnableInfo.disableReason = null;
    }
  }

  private handleRunError(error) {
    console.error(error);
    // todo: more specific error message?
    let message = null;
    if (error.isOperational) {
      const opError = <OperationalError> error;
      if (opError.name === RUNNER_ERRORS.PROCESS_NOT_COMPLETED) {
        // run error instance has status prop hence the casting to any
        message = (<any>opError).status === RUNNER_STATUS.Cancelled ? 'CANVAS:RUN-ERROR:RUN-CANCELLED' : 'CANVAS:RUN-ERROR:RUN-FAILED';
      } else if (opError.name === RUNNER_ERRORS.MAX_TRIALS_REACHED) {
        message = 'CANVAS:RUN-ERROR:MAX-REACHED';
      }
    }

    message = message || 'CANVAS:ERROR-MESSAGE';
    notification(this.translate.instant(message), 'error');
    return error;
  }

  private clearAllHandlersRunStatus() {
    Object.keys(this.handlers).forEach(handlerId => {
      const tasks = this.handlers[handlerId].tasks;
      if (_.isEmpty(tasks)) {
        return;
      }
      _.forIn(tasks, (task: any, taskID: string) => {
        // clear errors
        task.__props = task.__props || {};
        task.__props.errors = [];

        // ensure the presence of __status
        task.__status = task.__status || {};
        task.__status.isRunning = false;
        task.__status.hasRun = false;

      });
    });
  }

  private updateTaskRunStatus(steps: Step[], rsp: any) {
    let isErrorHandlerTouched = false;
    const runTasksIDs = <string[]>[];
    const errors = <{
      [index: string]: {
        msg: string;
        time: string;
      }[];
    }>{};
    let isFlowDone = false;
    const runTasks = _.reduce(steps, (result: any, step: any) => {
      const taskID = step.taskId;

      if (taskID !== 'root' && taskID !== 1 && !_.isNil(taskID)) { // if not rootTask and not `null`

        /****
         *  Exclude the tasks which are skipped by the engine while running the flow
         *  but their running task information is generated and maintained
         ****/
        const taskState = step.taskState || 0;
        if (taskState !== RUNNER_STATE.Skipped) {
          runTasksIDs.push(taskID);
        }
        const reAttrName = new RegExp(`^_A.${step.taskId}\\..*`, 'g');
        const reAttrErrMsg = new RegExp(`^\{Error.message}`, 'g');

        const taskInfo = _.reduce(_.get(step, 'flow.attributes', []),
          (currentTaskInfo: any, attr: any) => {
                    if (reAttrName.test(_.get(attr, 'name', ''))) {
                      currentTaskInfo[attr.name] = attr;
                    }

                    if (reAttrErrMsg.test(attr.name)) {
                      let errs = <any[]>_.get(errors, `${taskID}`);
                      const shouldOverride = _.isUndefined(errs);
                      errs = errs || [];

                      errs.push({
                        msg: attr.value,
                        time: new Date().toJSON()
                      });

                      if (shouldOverride) {
                        _.set(errors, `${taskID}`, errs);
                      }
                    }
                    return currentTaskInfo;
             }, {});

        result[taskID] = { attrs: taskInfo };
      } else if (_.isNull(taskID)) {
        isFlowDone = true;
      }

      return result;
    }, {});

    _.each(
      runTasksIDs, (runTaskID: string) => {
        let task = this.mainHandler.tasks[runTaskID];

        if (_.isEmpty(task)) {
          task = this.errorHandler.tasks[runTaskID];
          isErrorHandlerTouched = !!task;
        }

        if (task) {
          task.__status['hasRun'] = true;
          task.__status['isRunning'] = false;

          const errs = errors[runTaskID];
          if (!_.isUndefined(errs)) {
            _.set(task, '__props.errors', errs);
          }
        }
      }
    );

    _.set(rsp, '__status', {
      isFlowDone: isFlowDone,
      errors: errors,
      runTasks: runTasks,
      runTasksIDs: runTasksIDs
    });

    // update branch run status after apply the other status.
    updateBranchNodesRunStatus(this.mainHandler.diagram.nodes, this.mainHandler.tasks);
    updateBranchNodesRunStatus(this.errorHandler.diagram.nodes, this.errorHandler.tasks);

    if (isErrorHandlerTouched) {
      this._postService.publish(FLOGO_ERROR_PANEL_PUB_EVENTS.openPanel);
    }

    this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);

    // when the flow is done on error, throw an error
    // the error is the response with `__status` provisioned.
    if (isFlowDone && !_.isEmpty(errors)) {
      throw rsp;
    }

    // TODO logging
    // console.log( _.cloneDeep( this.tasks ) );

    // TODO
    //  how to verify if a task is running?
    //    should be the next task downstream the last running task
    //    but need to find the node of that task in the diagram

  }

  // TODO
  //  get step index logic should be based on the selected snapshot,
  //  hence need to be refined in the future
  private _getStepNumberFromSteps(taskId: string) {
    let stepNumber = 0;
    // firstly try to get steps from the last process instance running from the beginning,
    // otherwise use some defauts
    const steps = _.get(this.runState.lastProcessInstanceFromBeginning, 'steps', this.runState.steps || []);

    steps.forEach((step: any, index: number) => {
      // allowing double equals for legacy ids that were of type number
      /* tslint:disable-next-line:triple-equals */
      if (step.taskId == taskId) {
        stepNumber = index + 1;
      }
    });

    return stepNumber;
  }

  /*-------------------------------*
   |      Task Configurator        |
   *-------------------------------*/

  private _selectConfigureTaskFromDiagram(data: any, envelope: any) {
    const diagramId = data.id;
    let scope: any[];

    const selectedNode = data.node;

    if (diagramId === 'errorHandler') {
      const allPathsMainFlow = this.getAllPaths(this.handlers['root'].diagram.nodes);
      const previousTilesMainFlow = this.mapNodesToTiles(allPathsMainFlow, this.handlers['root']);

      const previousNodesErrorFlow = this.findPathToNode(this.handlers['errorHandler'].diagram.root.is, selectedNode.id, 'errorHandler');
      previousNodesErrorFlow.pop(); // ignore last item as it is the very same selected node
      const previousTilesErrorFlow = this.mapNodesToTiles(previousNodesErrorFlow, this.handlers['errorHandler']);

      scope = [...previousTilesMainFlow, makeDefaultErrorTrigger(''), ...previousTilesErrorFlow];
    } else {
      const previousNodes = this.findPathToNode(this.handlers[diagramId].diagram.root.is, selectedNode.id, diagramId);

      previousNodes.pop(); // ignore last item as it is the very same selected node
      scope = this.mapNodesToTiles(previousNodes, this.handlers[diagramId]);
    }

    const selectedTaskId = selectedNode.taskID;
    const selectedTile = <Task>_.cloneDeep(this.handlers[diagramId].tasks[selectedTaskId]);

    const metadata = <FlowMetadata>  _.defaultsDeep({
      type: 'metadata',
    }, this.flow.metadata, { input: [], output: [] });
    scope.push(metadata);

    let overridePropsToMap = null;
    let overrideMappings = null;
    let inputMappingsTabLabelKey = null;
    let searchTitleKey;
    let transformTitle;

    const currentTask = <ItemTask> _.cloneDeep(this.handlers[diagramId].tasks[data.node.taskID]);
    const activitySchema = this.flow.schemas[currentTask.ref];
    const  outputMapper = isMapperActivity(activitySchema);

    if (outputMapper) {
      overridePropsToMap = metadata.output;
      overrideMappings = _.get(selectedTile.attributes.inputs, '[0].value', []);
      transformTitle = this.translate.instant('TASK-CONFIGURATOR:TITLE-OUTPUT-MAPPER', { taskName: selectedTile.name });
      searchTitleKey = 'TASK-CONFIGURATOR:FLOW-OUTPUTS';
      inputMappingsTabLabelKey = 'TASK-CONFIGURATOR:FLOW-OUTPUTS';
    }

    const taskSettings = selectedTile.settings;
    const dataToPublish = _.assign(
      {}, FLOGO_TRANSFORM_PUB_EVENTS.selectTask, {
        data: <SelectTaskConfigEventData>{
          scope,
          overridePropsToMap,
          overrideMappings,
          inputMappingsTabLabelKey,
          tile: selectedTile,
          handlerId: diagramId,
          title: transformTitle,
          inputsSearchPlaceholderKey: searchTitleKey,
          iterator: {
            isIterable: isIterableTask(selectedTile),
            iterableValue: taskSettings && taskSettings.iterate ? taskSettings.iterate : null,
          },
        }
      }
    );
    if (isSubflowTask(selectedTile.type)) {
      const subflowSchema = this._flowService.currentFlowDetails.getSubflowSchema(selectedTile.settings.flowPath);
      if (subflowSchema) {
        dataToPublish.data.subflowSchema = subflowSchema;
        dataToPublish.data.appId = this.flow.appId;
        dataToPublish.data.actionId = this.flow.id;
      } else {
        return this.translate.get('SUBFLOW:REFERENCE-ERROR-TEXT')
          .subscribe(message => notification(message, 'error'));
      }
    }
    this._postService.publish(dataToPublish);

  }

  private _saveConfigFromTaskConfigurator(data: SaveTaskConfigEventData, envelope: any) {
    const diagramId = data.handlerId;
    const tile = <ItemTask> this.handlers[diagramId].tasks[data.tile.id];
    const changedSubflowSchema = data.changedSubflowSchema;
    const tileAsSubflow = <ItemSubflow> tile;
    if (changedSubflowSchema && tileAsSubflow.settings.flowPath !== data.tile.settings.flowPath) {
      this.manageFlowRelationships(tileAsSubflow.settings.flowPath);
      tile.name = this.uniqueTaskName(changedSubflowSchema.name);
      tile.description = changedSubflowSchema.description;
      tileAsSubflow.settings.flowPath = changedSubflowSchema.id;
      this._flowService.currentFlowDetails.addSubflowSchema(changedSubflowSchema);
    }
    const activitySchema = this.flow.schemas[tile.ref];
    const isMapperTask = isMapperActivity(activitySchema);
    if (isMapperTask) {
      tile.input.mappings = _.cloneDeep(data.inputMappings);
    } else {
      tile.inputMappings = _.cloneDeep(data.inputMappings);
    }

    tile.type = <any>data.tile.type;
    if (data.iterator.isIterable) {
      tile.settings = Object.assign({}, tile.settings, { iterate:  data.iterator.iterableValue });
    } else if (tile.settings) {
      delete tile.settings.iterate;
    }

    this.determineRunnableEnabled();
    // context potentially changed
    this.refreshCurrentTileContextIfNeeded();
    this._updateFlow(this.flow).then(() => {
      this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
    });
  }

  private getAllPaths(nodes: any) {
    return Object.keys(nodes);
  }

  /**
   * Finds a path from starting node to target node
   * Assumes we have a tree structure, meaning we have no cycles
   * @param {string} startNodeId
   * @param {string} targetNodeId
   * @param {string} diagramId
   * @returns string[] list of node ids
   */
  private findPathToNode(startNodeId: any, targetNodeId: any, diagramId: string) {
    const nodes = this.handlers[diagramId].diagram.nodes; // should be parameter?
    let queue = [[startNodeId]];

    while (queue.length > 0) {
      const path = queue.shift();
      const nodeId = path[path.length - 1];

      if (nodeId === targetNodeId) {
        return path;
      }

      const children = nodes[nodeId].children;
      if (children) {
        const paths = children.map(child => path.concat(child));
        queue = queue.concat(paths);
      }

    }

    return [];
  }

  private mapNodesToTiles(nodeIds: any[], from: HandlerInfo) {

    const isApplicableNodeType = _.includes.bind(null, [
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE,
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT,
    ]);

    return nodeIds
      .map(nodeId => {
        const node = from.diagram.nodes[nodeId];
        if (isApplicableNodeType(node.type)) {
          const task = from.tasks[node.taskID];
          // if (isSubflowTask(task.type)) {
          //   const subFlowSchema = this._flowService.currentFlowDetails.getSubflowSchema(task.settings.flowPath);
          //   task.attributes.outputs = _.get(subFlowSchema, 'metadata.output', []);
          // }
          return task;
        } else {
          return null;
        }
      })
      .filter(task => !!task);
  }


  /*-------------------------------*
   |      APP NAVIGATION           |
   *-------------------------------*/

  public navigateToApp() {
    this._router.navigate(['/apps', this.flow.appId]);
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
      this.flow.metadata.input = modifiedInputs;
      flowUpdatePromise = this._updateFlow(this.flow);
    } else {
      flowUpdatePromise = Promise.resolve(this.flow);
    }
    flowUpdatePromise.then(() => this._runFromRoot())
      .then(() => {
        const parsedURL = location.pathname.split('task/');
        if (parsedURL.length === 2 && _.isString(parsedURL[1])) {
          const taskId = parsedURL[1];
          const id = this.getDiagramId(taskId);
          if (id) {
            this._updateTaskOutputAfterRun({ id, taskId });
          }
        }
      });
  }

  private getDiagramId(taskId: string): string {
    let diagramId: string;
    if (this.handlers['root'].tasks[taskId]) {
      diagramId = 'root';
    } else if (this.handlers['errorHandler'].tasks[taskId]) {
      diagramId = 'errorHandler';
    }
    return diagramId;
  }

  private _updateTaskOutputAfterRun(data: {
    id: string,
    taskId: string
  }) {
    const diagramId: string = data.id;
    const currentDiagram: any = this.handlers[diagramId];
    const step = this._getCurrentState(data.taskId);
    const task = _.cloneDeep(currentDiagram.tasks[data.taskId]);
    const context = this._getCurrentTaskContext(data.taskId, diagramId);

    this._postService.publish(
      _.assign(
        {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
          data: _.assign({},
            data,
            { task, step, context }
          )
        }
      ));
  }

  public onFlowSchemaSave(newMetadata: FlowMetadata) {
    this.flow.metadata.input = this.mergeFlowInputMetadata(newMetadata.input);
    this.flow.metadata.output = newMetadata.output;

    const propCollectionToRegistry = (from) => new Map(<Array<[string, boolean]>>from.map((o: any) => [o.name, true]));

    const outputRegistry = propCollectionToRegistry(newMetadata.output);
    const inputRegistry = propCollectionToRegistry(newMetadata.input);
    this.cleanDanglingTaskOutputMappings(outputRegistry);

    this.cleanDanglingTriggerMappingsToFlow(inputRegistry);
    this._updateFlow(this.flow);
  }

  private mergeFlowInputMetadata(inputMetadata: MetadataAttribute[]): MetadataAttribute[] {
    return inputMetadata.map(input => {
      const existingInput = this.flow.metadata.input.find(i => i.name === input.name && i.type === input.type);
      if (existingInput) {
        input.value = existingInput.value;
      }
      return input;
    });
  }

  // when flow schema's input change we need to remove the trigger mappings that were referencing them
  private cleanDanglingTriggerMappingsToFlow(inputRegistry: Map<string, boolean>) {
    const isApplicableMapping = (mapping) => inputRegistry.has(mapping.mapTo);
    const handlersToUpdate = this.triggersList.reduce((result, trigger) => {
      const handlersToUpdateInTrigger = trigger.handlers
        .filter(handler => handler.actionId === this.flowId)
        .reduce(reduceToUpdatableHandlers, [])
        .map(handler => ({ handler, triggerId: trigger.id }));
      return result.concat(handlersToUpdateInTrigger);
    }, []);
    if (handlersToUpdate.length > 0) {
      return Promise.all(handlersToUpdate.map(({ handler, triggerId }) => {
        return this._restAPIHandlerService.updateHandler(triggerId, this.flowId, handler);
      }));
    }
    return Promise.resolve();

    function reduceToUpdatableHandlers(result, handler) {
      const actionInputMappings = _.get(handler, 'actionMappings.input', []);
      const applicableMappings = actionInputMappings.filter(isApplicableMapping);
      if (applicableMappings.length !== actionInputMappings.length) {
        handler.actionMappings.input = applicableMappings;
        result.push(handler);
      }
      return result;
    }
  }

  // when flow schema's output change we need to remove the task mappings that were referencing them
  private cleanDanglingTaskOutputMappings(outputRegistry: Map<string, boolean>) {
    const isMapperContribAndHasMapping = (task: Task) => {
      const schema = this.flow.schemas[task.ref];
      return !!(isMapperActivity(schema) && task.attributes.inputs.length);
    };
    _.filter(this._getAllTasks(), isMapperContribAndHasMapping)
      .forEach((task: Task) => {
        task.attributes.inputs.forEach((mapping) => {
          mapping.value = mapping.value.filter((m) => outputRegistry.has(m.mapTo));
        });
      });
  }

  private manageFlowRelationships(flowId: string) {
    if (!this.isFlowUsedAgain(flowId)) {
      this._flowService.currentFlowDetails.deleteSubflowSchema(flowId);
    }
  }

  private isFlowUsedAgain(id: string) {
    return !!_.values(this._getAllTasks()).find((t: ItemSubflow) => t.settings && t.settings.flowPath === id);
  }

}
