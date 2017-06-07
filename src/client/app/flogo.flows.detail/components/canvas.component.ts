import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PostService } from '../../../common/services/post.service';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { RunnerService, RUN_STATUS_CODE as RUNNER_STATUS, ERRORS as RUNNER_ERRORS, RunOptions, RunProgress, RunProgressStore, Step } from '../services/runner.service';
import { OperationalError } from '../../../common/services/error.service';

import 'rxjs/add/operator/do';

import { IFlogoFlowDiagramTaskDictionary, IFlogoFlowDiagram, IFlogoFlowDiagramTask, makeDefaultErrorTrigger } from '../../../common/models';

import { SUB_EVENTS as FLOGO_DIAGRAM_PUB_EVENTS, PUB_EVENTS as FLOGO_DIAGRAM_SUB_EVENTS } from '../../flogo.flows.detail.diagram/messages';
import { SUB_EVENTS as FLOGO_TRIGGERS_PUB_EVENTS, PUB_EVENTS as FLOGO_TRIGGERS_SUB_EVENTS } from '../../flogo.flows.detail.triggers/messages';
import { SUB_EVENTS as FLOGO_ADD_TASKS_PUB_EVENTS, PUB_EVENTS as FLOGO_ADD_TASKS_SUB_EVENTS } from '../../flogo.flows.detail.tasks/messages';
import { SUB_EVENTS as FLOGO_SELECT_TASKS_PUB_EVENTS, PUB_EVENTS as FLOGO_SELECT_TASKS_SUB_EVENTS } from '../../flogo.flows.detail.tasks.detail/messages';
import { PUB_EVENTS as FLOGO_TASK_SUB_EVENTS, SUB_EVENTS as FLOGO_TASK_PUB_EVENTS } from '../../flogo.form-builder/messages'
import { PUB_EVENTS as FLOGO_TRANSFORM_SUB_EVENTS, SUB_EVENTS as FLOGO_TRANSFORM_PUB_EVENTS } from '../../flogo.transform/messages';
import { PUB_EVENTS as FLOGO_ERROR_PANEL_SUB_EVENTS, SUB_EVENTS as FLOGO_ERROR_PANEL_PUB_EVENTS } from '../../flogo.flows.detail.error-panel/messages'
import { PUB_EVENTS as FLOGO_LOGS_SUB_EVENTS } from '../../flogo.logs/messages';

import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import { RESTAPITriggersService } from '../../../common/services/restapi/v2/triggers-api.service';
import { AppsApiService } from '../../../common/services/restapi/v2/apps-api.service';
import { RESTAPIHandlersService } from '../../../common/services/restapi/v2/handlers-api.service';
import { FLOGO_TASK_TYPE, FLOGO_FLOW_DIAGRAM_NODE_TYPE, ERROR_CODE } from '../../../common/constants';
import { flogoIDDecode, flogoIDEncode, flogoGenTaskID, normalizeTaskName, notification,
  attributeTypeToString, flogoGenBranchID, flogoGenTriggerID, updateBranchNodesRunStatus,
  objectFromArray
} from '../../../common/utils';

import { flogoFlowToJSON, triggerFlowToJSON } from '../../flogo.flows.detail.diagram/models/flow.model';
import { FlogoModal } from '../../../common/services/modal.service';
import { HandlerInfo } from '../models/models';
import { FlogoFlowService as FlowsService } from '../services/flow.service';

interface IPropsToUpdateFormBuilder {
  name: string;
}

@Component({
  selector: 'flogo-canvas',
  // moduleId: module.id,
  templateUrl: 'canvas.tpl.html',
  styleUrls: ['canvas.component.less']
})

export class FlogoCanvasComponent implements OnInit {
  public flow: any;
  public flowId: string;
  public mainHandler: HandlerInfo;
  public errorHandler: HandlerInfo;
  public handlers: { [id: string]: HandlerInfo };


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
  backToAppHover: boolean;

  public loading: boolean;
  public hasTrigger: boolean;
  public currentTrigger: any;
  public app: any;

  constructor(public translate: TranslateService,
              private _postService: PostService,
              private _restAPIFlowsService: RESTAPIFlowsService,
              private _flowService: FlowsService,
              private _restAPITriggersService: RESTAPITriggersService,
              private _restAPIHandlerService: RESTAPIHandlersService,
              private _restAPIAppsService: AppsApiService,
              private _runnerService: RunnerService,
              private _router: Router,
              private _flogoModal: FlogoModal,
              private _route: ActivatedRoute) {
    this._isDiagramEdited = false;

    this.loading = true;
    this.hasTrigger = true;
    this.currentTrigger = null;
    this.app = null;
  }

  public ngOnInit() {
    this.flowId = this._route.snapshot.params['id'];
    this.backToAppHover = false;

    this._loadFlow(this.flowId)
      .then(() => {
        this.initSubscribe();
      });
  }

  private initSubscribe() {
    this._subscriptions = [];

    let subs = [
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.addTask, { callback: this._addTaskFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.addTrigger, { callback: this._addTriggerFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectTask, { callback: this._selectTaskFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.deleteTask, { callback: this._deleteTaskFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.addBranch, { callback: this._addBranchFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectBranch, { callback: this._selectBranchFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectTransform, { callback: this._selectTransformFromDiagram.bind(this) }),
      _.assign({}, FLOGO_DIAGRAM_SUB_EVENTS.selectTrigger, { callback: this._selectTriggerFromDiagram.bind(this) }),
      _.assign({}, FLOGO_TRIGGERS_SUB_EVENTS.addTrigger, { callback: this._addTriggerFromTriggers.bind(this) }),
      _.assign({}, FLOGO_SELECT_TASKS_SUB_EVENTS.triggerAction , { callback: this._onActionTrigger.bind(this) }),
      _.assign({}, FLOGO_ADD_TASKS_SUB_EVENTS.addTask, { callback: this._addTaskFromTasks.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.runFromThisTile, { callback: this._runFromThisTile.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.runFromTrigger, { callback: this._runFromTriggerinTile.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.setTaskWarnings, { callback: this._setTaskWarnings.bind(this) }),
      _.assign({}, FLOGO_TRANSFORM_SUB_EVENTS.saveTransform, { callback: this._saveTransformFromTransform.bind(this) }),
      _.assign({}, FLOGO_TRANSFORM_SUB_EVENTS.deleteTransform, { callback: this._deleteTransformFromTransform.bind(this) }),
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
    let message = this.translate.instant('FLOWS:CONFIRM_DELETE', { flowName: this.flow.name });
    this._flogoModal.confirmDelete(message)
      .then((res) => {
        if (res) {
          let appPromise = null;
          appPromise = (this.app) ? Promise.resolve(this.app) : this._restAPIAppsService.getApp(this.flow.app.id);

          appPromise
            .then((app) => {
              let triggerDetails = this.getTriggerCurrentFlow(app, this.flow.id);
              return this._flowService.deleteFlow(this.flowId, triggerDetails ? triggerDetails.id : null);
            })
            .then(() => {
              this.navigateToApp();
            })
            .then(() => {
              let message = this.translate.instant('FLOWS:SUCCESS-MESSAGE-FLOW-DELETED');
              notification(message, 'success', 3000);
            })
            .catch(err => {
              let message = this.translate.instant('FLOWS:ERROR-MESSAGE-REMOVE-FLOW', err);
              notification(message, 'error');
              console.error(err);
            });
        }
      })
  }

  private _updateFlow(flow: any) {
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

    return this._flowService.saveFlow(this.flowId, flow).then(rsp => {
      console.groupCollapsed('Flow updated');
      console.log(rsp);
      console.groupEnd();
      return rsp;
    });

  }

  private _loadFlow(flowId: string) {
    this.loading = true;
    return this._flowService.getFlow(flowId)
      .then((res: any) => {
        const FLOW_HANDLER_TYPE_ROOT = 'root';
        const FLOW_HANDLER_TYPE_ERROR = 'errorHandler';
        this.flow = res.flow;
        this.flowName = this.flow.name;
        this.handlers = {
          [FLOW_HANDLER_TYPE_ROOT]: res.root,
          [FLOW_HANDLER_TYPE_ERROR]: res.errorHandler
        };

        this.mainHandler = this.handlers[FLOW_HANDLER_TYPE_ROOT];
        this.errorHandler = this.handlers[FLOW_HANDLER_TYPE_ERROR];
        if ( _.isEmpty( this.mainHandler.diagram ) || _.isEmpty( this.mainHandler.diagram.root ) ) {
          this.hasTrigger = false;
        }

        this.clearAllHandlersRunStatus();
        this.loading = false;

      });
  }

  private _getCurrentState(taskID: string) {
    const steps = this.runState.steps || [];
    let id:any = taskID;
    try { // try to decode the base64 encoded taskId to number
      id = flogoIDDecode(taskID);
    } catch (e) {
      console.warn(e);
    }
    return steps.find(step => id == step.taskId);
  }

  private _cleanSelectionStatus() {
    let allNodes = _.reduce(this.handlers, (allNodes, handle) => {
      return _.assign(allNodes, _.get(handle, 'diagram.nodesOfAddType', {}), _.get(handle, 'diagram.nodes', {}));
    }, {});
    _.forEach(allNodes, node => _.set(node, '__status.isSelected', false));

    this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
  }


  private _errorPanelStatusChanged(isOpened: boolean, data: any, envelope: any) {

    console.group('Close/open error panel from error panel');

    // clean selection status

    let allNodes = _.reduce(this.handlers, (allNodes, handle) => {
      return _.assign(allNodes, _.get(handle, 'diagram.nodesOfAddType', {}), _.get(handle, 'diagram.nodes', {}));
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
    let newNormalizedName = normalizeTaskName(taskName);

    //All activities are gathered in one variable
    let allTasks = _.reduce(this.handlers, (all: any, current: any) => _.assign(all, current.tasks), {});

    //search for the greatest index in all the flow
    let greatestIndex = _.reduce(allTasks, (greatest: number, task: any) => {
      let currentNormalized = normalizeTaskName(task.name);
      let repeatIndex = 0;
      if (newNormalizedName == currentNormalized) {
        repeatIndex = 1;
      } else {
        let match = /^(.*)\-([0-9]+)$/.exec(currentNormalized); // some-name-{{integer}}
        if (match && match[1] == newNormalizedName) {
          repeatIndex = _.toInteger(match[2]);
        }
      }

      return repeatIndex > greatest ? repeatIndex : greatest;

    }, 0);

    return greatestIndex > 0 ? `${taskName} (${greatestIndex + 1})` : taskName;
  }

  private _getCurrentContext(taskId: any, diagramId: string) {
    let isTrigger = this.handlers[diagramId].tasks[taskId].type === FLOGO_TASK_TYPE.TASK_ROOT;
    let isBranch = this.handlers[diagramId].tasks[taskId].type === FLOGO_TASK_TYPE.TASK_BRANCH;
    let isTask = this.handlers[diagramId].tasks[taskId].type === FLOGO_TASK_TYPE.TASK;

    return {
      isTrigger: isTrigger,
      isBranch: isBranch,
      isTask: isTask,
      hasProcess: !!this.runState.currentProcessId,
      isDiagramEdited: this._isDiagramEdited,
      app: null,
      currentTrigger: null
    };
  }

  /*-------------------------------*
   |       EXPORT AND IMPORT       |
   *-------------------------------*/

  exportTriggerAndFlow() {
    return this._exportTriggerAndFlow.bind(this);
  }

  private _exportTriggerAndFlow() {
    let flow = this._exportFlow();
    let trigger = this._exportTrigger();

    return Promise.all([trigger, flow]);
  }

  private _exportFlow() {
    return new Promise((resolve, reject) => {
      let jsonFlow = flogoFlowToJSON(this.flow);
      return resolve({ fileName: 'flow.json', data: jsonFlow.flow });
    });
  }

  private _exportTrigger() {
    return new Promise((resolve, reject) => {
      let jsonTrigger = triggerFlowToJSON(this.flow)
      resolve({ fileName: 'trigger.json', data: jsonTrigger });
    });
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
        let message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-UPDATE', { value: property });
        notification(message, 'success', 3000);
        resolve(response);
      }).catch((err) => {
        let message = this.translate.instant('CANVAS:ERROR-MESSAGE-UPDATE', { value: property });
        notification(message, 'error');
        reject(err);
      });
    })

  }

  public changeFlowDetailName(name, property) {
    if (name == this.flowName) {
      return Promise.resolve(true);
    }

    return this._flowService.listFlowsByName(this.flow.appId, name)
      .then((flows) => {
        let results = flows || [];
        if (!_.isEmpty(results)) {
          if (results[0].id === this.flowId) {
            return;
          }
          let message = this.translate.instant('CANVAS:FLOW-NAME-EXISTS', { value: name });
          this.flow.name = this.flowName;
          notification(message, 'error');
          return results;
        } else {
          this.flow.name = name;
          this._updateFlow(this.flow).then((response: any) => {
            let message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-UPDATE', { value: property });
            this.flowName = this.flow.name;
            notification(message, 'success', 3000);
            return response;
          }).catch((err) => {
            let message = this.translate.instant('CANVAS:ERROR-MESSAGE-UPDATE', { value: property });
            notification(message, 'error');
            return Promise.reject(err);
          });
        }
      })
      .catch((err) => {
        let message = this.translate.instant('CANVAS:ERROR-MESSAGE-UPDATE', { value: property });
        notification(message, 'error');
        return Promise.reject(err);
      });
  }

  private _addTriggerFromDiagram(data: any, envelope: any) {
    console.group('Add trigger message from diagram');
    console.log(data);
    console.log(envelope);

    this._navigateFromModuleRoot(['trigger', 'add'])
      .then(
        () => {
          console.group('after navigation');

          this._postService.publish(
            _.assign(
              {}, FLOGO_TRIGGERS_PUB_EVENTS.addTrigger, {
                data: data
              }
            )
          );

          console.groupEnd();
        });

    console.groupEnd();
  }

  private getSettingsCurrentHandler () {
    let settings, outputs;
    for(let key in this.flow.items) {
      if(this.flow.items[key].type === FLOGO_TASK_TYPE.TASK_ROOT) {
        settings = objectFromArray(this.flow.items[key].endpoint.settings, true);
        outputs = objectFromArray(this.flow.items[key].outputs, true);
      }
    }

    return {settings, outputs};
  }

  private _onActionTrigger(data: any, envelope: any) {

    if(data.action === 'trigger-copy') {
      let triggerSettings = _.pick(this.currentTrigger, ['name', 'description', 'ref', 'settings']);
      this._restAPITriggersService.createTrigger(this.app.id, triggerSettings)
        .then((createdTrigger) => {
          this.currentTrigger = createdTrigger;
          let settings = this.getSettingsCurrentHandler();
          return this._restAPIHandlerService.updateHandler(createdTrigger.id, this.flow.id, settings )
            .then((res) => {
              let message = this.translate.instant('CANVAS:COPIED-TRIGGER');
              notification(message, 'success', 3000);
              this._restAPIAppsService.getApp(this.flow.app.id)
                .then((app) => {
                  let updatedTriggerDetails = _.assign({}, this.currentTrigger);
                  updatedTriggerDetails.handlers.push(_.assign({}, _.pick(res, [
                    'actionId',
                    'createdAt',
                    'outputs',
                    'settings',
                    'updatedAt'
                  ])));
                  this.currentTrigger = updatedTriggerDetails;
                  this.app = app;
                  this._postService.publish(_.assign({}, FLOGO_SELECT_TASKS_PUB_EVENTS.updateTriggerTask, {
                    data: {
                      updatedApp: app,
                      updatedTrigger: updatedTriggerDetails
                    }
                  }));
                });
            });
        });
    }

  }

  private _addTriggerFromTriggers(data: any, envelope: any) {
    console.group('Add trigger message from trigger');

    console.log(data);
    console.log(envelope);

    // generate trigger id when adding the trigger;
    //  TODO replace the task ID generation function?
    let trigger = <IFlogoFlowDiagramTask> _.assign({}, data.trigger, { id: flogoGenTriggerID() });

    let diagramId = data.id;
    let handler = this.handlers[diagramId];

    if (handler == this.errorHandler) {
      trigger.id = flogoGenTaskID(this._getAllTasks());
    }
    let tasks = handler.tasks || [];

    this.handlers['root']['schemas'] = this.handlers['root']['schemas'] || {};
    trigger.ref = trigger.ref || trigger['__schema'].ref;
    this.handlers['root']['schemas'][trigger.ref] = trigger;
    delete trigger['__schema'];
    tasks[trigger.id] = trigger;


    let resultCreateTrigger;
    let settings = objectFromArray(data.trigger.endpoint.settings, false);
    let outputs = objectFromArray(data.trigger.outputs, false);

    if(data.installType === 'installed') {
      let appId = this.flow.app.id;
      let triggerInfo: any = _.pick(data.trigger, ['name', 'ref', 'description']);
      triggerInfo.settings = objectFromArray(data.trigger.settings || [], false);

      resultCreateTrigger = this._restAPITriggersService.createTrigger(appId, triggerInfo)
        .then( (triggerResult)=> {
          let triggerId = triggerResult.id;
          return this._restAPIHandlerService.updateHandler(triggerId, this.flow.id, {settings, outputs});
        });
    } else {
      const triggerId = data.trigger.id;
      resultCreateTrigger = this._restAPIHandlerService.updateHandler(triggerId, this.flow.id, {settings, outputs});
    }

    resultCreateTrigger
      .then(() => this._loadFlow(this.flowId))
      .then(() => {
        this.hasTrigger = true;
        return this._navigateFromModuleRoot();
      })
      .then(
        () => {
          this._postService.publish(
            _.assign(
              {}, FLOGO_DIAGRAM_PUB_EVENTS.addTrigger, {
                data: {
                  id: data.id,
                  node: data.node,
                  task: trigger
                },
                done: (diagram: IFlogoFlowDiagram) => {
                  _.assign(handler.diagram, diagram);
                  this._updateFlow(this.flow);
                  this._isDiagramEdited = true;
                }
              }
            )
          );
        }
      );


    console.groupEnd();
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
    let diagramId: string = data.id;
    console.group('Add task message from task');

    console.log(data);
    console.log(envelope);

    let doRegisterTask = _registerTask.bind(this);

    if (this.handlers[diagramId] == this.errorHandler && _.isEmpty(this.errorHandler.tasks)) {
      let errorTrigger = makeDefaultErrorTrigger(flogoGenTaskID(this._getAllTasks()));
      this.errorHandler.tasks[errorTrigger.id] = errorTrigger;

      this._postService.publish(
        _.assign(
          {}, FLOGO_DIAGRAM_PUB_EVENTS.addTask, {
            data: {
              node: null,
              task: errorTrigger,
              id: data.id
            },
            done: (diagram: IFlogoFlowDiagram) => {
              _.assign(this.handlers[diagramId].diagram, diagram);
              this._updateFlow(this.flow);
              this._isDiagramEdited = true;
              doRegisterTask();
            }
          }
        )
      );

    } else {
      doRegisterTask();
    }

    function _registerTask() {
      let taskName = this.uniqueTaskName(data.task.name);
      // generate task id when adding the task
      let task = <IFlogoFlowDiagramTask> _.assign({},
        data.task,
        {
          id: flogoGenTaskID(this._getAllTasks()),
          name: taskName
        });

      this.handlers[diagramId].tasks[task.id] = task;

      this.handlers['root'].schemas = this.handlers['root'].schemas || {};
      task.ref = task.ref || task['__schema'].ref;
      this.handlers['root'].schemas[task.ref] = task;

      delete task['__schema'];

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
                  done: (diagram: IFlogoFlowDiagram) => {
                    _.assign(this.handlers[diagramId].diagram, diagram);
                    this._updateFlow(this.flow);
                    this._isDiagramEdited = true;
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
    let trigger:any = null;

    let triggers = app.triggers.filter((trigger) => trigger.appId === app.id);

    if(triggers) {
      triggers.forEach((currentTrigger) => {
        let handlers = currentTrigger.handlers.find((handler) => {
          return handler.actionId === flowId;
        });

        if(handlers) {
          trigger = currentTrigger;
          return trigger;
        }
      });
    }

    return trigger;
  }


  private _selectTriggerFromDiagram(data: any, envelope: any) {
    let diagramId: string = data.id;
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
              var currentStep = this._getCurrentState(data.node.taskID);
              var currentTask = this.handlers[diagramId].tasks[data.node.taskID];
              var context = this._getCurrentContext(data.node.taskID, diagramId);

              if(!this.currentTrigger) {
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
                                done: (diagram: IFlogoFlowDiagram) => {
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
    let diagramId: string = data.id;

    console.group('Select task message from diagram');
    console.log(data);
    console.log(envelope);


    this._navigateFromModuleRoot(['task', data.node.taskID])
      .then(
        () => {
          console.group('after navigation');

          // Refresh task detail
          var currentStep = this._getCurrentState(data.node.taskID);
          var currentTask = _.assign({}, _.cloneDeep(this.handlers[diagramId].tasks[data.node.taskID]));
          var context = this._getCurrentContext(data.node.taskID, diagramId);

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
                        done: (diagram: IFlogoFlowDiagram) => {
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

          console.groupEnd();
        }
      );

    console.groupEnd();
  }

  private _changeTileDetail(data: {
    content: string;
    proper: string;
    taskId: any,
    id: string
  }, envelope: any) {
    var task = this.handlers[data.id].tasks[data.taskId];

    if (task) {
      if (data.proper == 'name') {
        task[data.proper] = this.uniqueTaskName(data.content);
      } else {
        task[data.proper] = data.content;
      }
      let updateObject = {};

      let propsToUpdateFormBuilder: IPropsToUpdateFormBuilder = <IPropsToUpdateFormBuilder> {};

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

      if(task.type === FLOGO_TASK_TYPE.TASK_ROOT) {
        updateObject[data.proper] = task[data.proper];
        this._restAPITriggersService.updateTrigger(this.currentTrigger.id, updateObject);
      }


    }
  }

  private _deleteTaskFromDiagram(data: any, envelope: any) {
    let diagramId: string = data.id;

    console.group('Delete task message from diagram');

    console.log(data);
    //data.id = this.flow._id;

    let task = this.handlers[diagramId].tasks[_.get(data, 'node.taskID', '')];
    let node = this.handlers[diagramId].diagram.nodes[_.get(data, 'node.id', '')];
    let _diagram = this.handlers[diagramId].diagram;

    // TODO
    //  refine confirmation
    //  delete trigger isn't hanlded
    if (node.type !== FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT && task) {
      this._flogoModal.confirmDelete('Are you sure you want to delete this task?').then((res) => {
        if (res) {

          // clear details panel, if the selected activity is deleted
          // verify if should jump back to detail page before sending delete message
          let _shouldGoBack = false;
          let parsedURL = location.pathname.split('task/');
          if (parsedURL.length === 2 && _.isString(parsedURL[1])) {

            let currentTaskID = parsedURL[1];
            let deletingTaskID = _.get(data, 'node.taskID', '');

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
                let children = _.get(parentNode, 'children', []);

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
                done: (diagram: IFlogoFlowDiagram) => {
                  // TODO
                  //  NOTE that once delete branch, not only single task is removed.
                  delete this.handlers[diagramId].tasks[_.get(data, 'node.taskID', '')];
                  _.assign(this.handlers[diagramId].diagram, diagram);
                  this._updateFlow(this.flow);
                  this._isDiagramEdited = true;

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
    let diagramId: string = data.id;

    console.group('Add branch message from diagram');
    console.log(data);

    // TODO
    //  remove this mock later
    //    here just creating a branch node with new branch info

    let branchInfo = {
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
      done: (diagram: IFlogoFlowDiagram) => {
        _.assign(this.handlers[diagramId].diagram, diagram);
        this._updateFlow(this.flow);
      }
    }));

    console.groupEnd();
  }

  private _selectBranchFromDiagram(data: any, envelope: any) {
    let diagramId: string = data.id;
    console.group('Select branch message from diagram');

    console.log(data);

    // TODO
    //  reference to _selectTaskFromDiagram
    //  may need to route to some other URL?
    var currentStep = this._getCurrentState(data.node.taskID);
    var currentTask = _.assign({}, _.cloneDeep(this.handlers[diagramId].tasks[data.node.taskID]));
    var context = this._getCurrentContext(data.node.taskID, diagramId);

    let selectedNode = data.node;
    let previousNodes = this.findPathToNode(this.handlers[diagramId].diagram.root.is, selectedNode.id, diagramId);
    previousNodes.pop(); // ignore last item as it is the very same selected node
    let previousTiles = this.mapNodesToTiles(previousNodes, this.handlers[diagramId]);


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
                        done: (diagram: IFlogoFlowDiagram) => {
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
    let diagramId = data.id;

    console.group('Save task details to flow');
    var task = this.handlers[diagramId].tasks[data.taskId];

    if (task.type === FLOGO_TASK_TYPE.TASK) { // TODO handle more activity task types in the future
      // set/unset the warnings in the tile
      _.set(task, '__props.warnings', data.warnings);

      var changedInputs = data.inputs || {};
      this._updateAttributesChanges(task, changedInputs, 'attributes.inputs');

    } else if (task.type === FLOGO_TASK_TYPE.TASK_ROOT) { // trigger
      let updatePromise: any = Promise.resolve(true);

      if(data.changedStructure === 'settings') {
        updatePromise = this._restAPITriggersService.updateTrigger(this.currentTrigger.id, {settings: data.settings})
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
            let newValue = data.outputs[output.name];

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

    //this._updateFlow( this.flow );
    this._updateFlow(this.flow).then(() => {
      this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
    });

    console.groupEnd();
  }

  private _updateAttributesChanges(task: any, changedInputs: any, structure: any) {

    for (var name in changedInputs) {
      var attributes = _.get(task, structure, []);

      attributes.forEach((input) => {
        if (input.name === name) {
          input['value'] = changedInputs[name];
        }
      });
    }

  }

  private _setTaskWarnings(data: any, envelope: any) {
    let diagramId = data.id;

    var task = this.handlers[diagramId].tasks[data.taskId];

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

  private _runFromTriggerinTile(data: any, envelope: any) {
    let diagramId: string = data.id;
    let currentDiagram: any = this.handlers[diagramId];

    console.group('Run from Trigger');

    this._runFromRoot().then((res) => {
      var currentStep = this._getCurrentState(data.taskId);
      var currentTask = _.assign({}, _.cloneDeep(currentDiagram.tasks[data.taskId]));
      var context = this._getCurrentContext(data.taskId, diagramId);

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
    const runOptions : RunOptions = { attrsData: initData };
    let shouldUpdateFlow = this._isCurrentProcessDirty || !this.runState.currentProcessId;
    if (shouldUpdateFlow) {
      runOptions.useFlow = this.flow;
    } else {
      runOptions.useProcessId = this.runState.currentProcessId;
    }

    this.runState.steps = null;
    let runner = this._runnerService.runFromRoot(runOptions);

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

    let selectedTask = this.mainHandler.tasks[data.taskId];

    if (selectedTask.type === FLOGO_TASK_TYPE.TASK_ROOT) {
      this._runFromTriggerinTile(data, envelope);
      return;
    } else if (!this.runState.processInstanceId) {
      // run from other than the trigger (root task);
      // TODO
      console.warn('Cannot find proper step to restart from, skipping...');
      return;
    }

    let step = this._getStepNumberFromSteps(data.taskId);

    if (!step) {
      // TODO
      //  handling the case that trying to start from the middle of a path without run from the trigger for the first time.
      let task = this.mainHandler.tasks[data.taskId];
      console.error(`Cannot start from task ${task.name} (${task.id})`);
      return;
    }

    let attrs = _.get(selectedTask, 'attributes.inputs');

    let dataOfInterceptor = {
      tasks: [{
        id: parseInt(flogoIDDecode(selectedTask.id)),
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
        let currentStep = this._getCurrentState(data.taskId);
        let currentTask = _.assign({}, _.cloneDeep(this.mainHandler.tasks[data.taskId]));
        let context = this._getCurrentContext(data.taskId, 'root');

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

    function parseInput(attrs: any, inputData: any) {
      if (!attrs) {
        return [];
      }
      return _.map(attrs, (input: any) => {
        // override the value;
        return _.assign(_.cloneDeep(input), {
          value: inputData[input['name']],
          type: attributeTypeToString(input['type'])
        });
      });
    }

  }

  // monitor the status of a process till it's done or up to the max trials
  private observeRunProgress(runner: RunProgressStore): Promise<RunProgress|void> {

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
        let message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-COMPLETED');
        notification(message, 'success', 3000);
      })
      .toPromise();

  }

  private logRunStatus(processStatus) {
    switch (processStatus.status) {
      case RUNNER_STATUS.NOT_STARTED:
        console.log(`[PROC STATE][${processStatus.trial}] Process has not started.`);
        break;
      case RUNNER_STATUS.ACTIVE:
        console.log(`[PROC STATE][${processStatus.trial}] Process is running...`);
        break;
      case RUNNER_STATUS.COMPLETED:
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
    let mainHandler = this.mainHandler;
    try { // rootTask should be in DONE status once the flow start
      let rootTask = mainHandler.tasks[mainHandler.diagram.nodes[mainHandler.diagram.root.is].taskID];
      rootTask.__status['hasRun'] = true;
      rootTask.__status['isRunning'] = false;
    } catch (e) {
      console.warn(e);
      console.warn('No root task/trigger is found.');
    }
  }

  private getInitDataForRoot(): { name: string; type: string; value: any }[] {
    let rootId = this.mainHandler.diagram.root.is;
    let rootNode = this.mainHandler.diagram.nodes[rootId];
    let initData = <any>_.get(this.mainHandler.tasks[rootNode.taskID], '__props.outputs');
    if (_.isEmpty(initData)) {
      initData = undefined;
    } else {
      // preprocessing initial data
      initData = _(initData)
        .filter((item: any) => {
          // filter empty values
          return !_.isNil(item.value);
        })
        .map((item: any) => {
          // converting the type of the initData from enum to string;
          let outItem = _.cloneDeep(item);
          outItem.type = attributeTypeToString(outItem.type);
          return outItem;
        })
        .value();
    }
    return initData;
  }

  private handleRunError(error) {
    console.error(error);
    // todo: more specific error message?
    let message = null;
    if (error.isOperational) {
      let opError = <OperationalError> error;
      if (opError.name === RUNNER_ERRORS.PROCESS_NOT_COMPLETED) {
        // run error instance has status prop hence the casting to any
        message = (<any>opError).status === RUNNER_STATUS.CANCELLED ? 'CANVAS:RUN-ERROR:RUN-CANCELLED' : 'CANVAS:RUN-ERROR:RUN-FAILED';
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
    let runTasksIDs = <string[]>[];
    let errors = <{
      [index: string]: {
        msg: string;
        time: string;
      }[];
    }>{};
    let isFlowDone = false;
    let runTasks = _.reduce(steps, (result: any, step: any) => {
      let taskID = step.taskId;

      if (taskID !== 1 && !_.isNil(taskID)) { // if not rootTask and not `null`

        taskID = flogoIDEncode('' + taskID);
        runTasksIDs.push(taskID);
        let reAttrName = new RegExp(`^\{A${step.taskId}\\..*`, 'g');
        let reAttrErrMsg = new RegExp(`^\{Error.message}`, 'g');

        let taskInfo = _.reduce(_.get(step, 'flow.attributes', []), (taskInfo: any, attr: any) => {
          if (reAttrName.test(_.get(attr, 'name', ''))) {
            taskInfo[attr.name] = attr;
          }

          if (reAttrErrMsg.test(attr.name)) {
            let errs = <any[]>_.get(errors, `${taskID}`);
            let shouldOverride = _.isUndefined(errs);
            errs = errs || [];

            errs.push({
              msg: attr.value,
              time: new Date().toJSON()
            });

            if (shouldOverride) {
              _.set(errors, `${taskID}`, errs);
            }
          }
          return taskInfo;
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

          let errs = errors[runTaskID];
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
    var stepNumber: number = 0;
    // firstly try to get steps from the last process instance running from the beginning,
    // otherwise use some defauts
    let steps = _.get(this.runState.lastProcessInstanceFromBeginning, 'steps', this.runState.steps || []);
    taskId = flogoIDDecode(taskId); // decode the taskId

    steps.forEach((step: any, index: number) => {
      if (step.taskId == taskId) {
        stepNumber = index + 1;
      }
    });

    return stepNumber;
  }

  /*-------------------------------*
   |      TRANSFORM                |
   *-------------------------------*/

  private _selectTransformFromDiagram(data: any, envelope: any) {
    let diagramId: string = data.id;
    let previousTiles: any;

    let selectedNode = data.node;

    if (diagramId == 'errorHandler') {
      let allPathsMainFlow = this.getAllPaths(this.handlers['root'].diagram.nodes);
      let previousTilesMainFlow = this.mapNodesToTiles(allPathsMainFlow, this.handlers['root']);

      let previousNodesErrorFlow = this.findPathToNode(this.handlers['errorHandler'].diagram.root.is, selectedNode.id, 'errorHandler');
      previousNodesErrorFlow.pop(); // ignore last item as it is the very same selected node
      let previousTilesErrorFlow = this.mapNodesToTiles(previousNodesErrorFlow, this.handlers['errorHandler']);

      previousTiles = previousTilesMainFlow.concat(previousTilesErrorFlow);
    } else {
      let previousNodes = this.findPathToNode(this.handlers[diagramId].diagram.root.is, selectedNode.id, diagramId);

      previousNodes.pop(); // ignore last item as it is the very same selected node
      previousTiles = this.mapNodesToTiles(previousNodes, this.handlers[diagramId]);
    }

    //let previousTiles = this.mapNodesToTiles(previousNodes, diagramId);

    let selectedTaskId = selectedNode.taskID;


    this._postService.publish(
      _.assign(
        {}, FLOGO_TRANSFORM_PUB_EVENTS.selectActivity, {
          data: {
            previousTiles,
            tile: _.cloneDeep(this.handlers[diagramId].tasks[selectedTaskId]),
            id: diagramId
          }
        }
      ));

  }

  private _saveTransformFromTransform(data: any, envelope: any) {
    let diagramId: string = data.id;

    // data.tile.taskId
    // data.inputMappings

    let tile = this.handlers[diagramId].tasks[data.tile.id];
    tile.inputMappings = _.cloneDeep(data.inputMappings);

    this._updateFlow(this.flow).then(() => {
      this._postService.publish(FLOGO_DIAGRAM_PUB_EVENTS.render);
    });

  }

  private _deleteTransformFromTransform(data: any, envelope: any) {
    let diagramId: string = data.id;

    // data.tile.taskId
    let tile = this.handlers[diagramId].tasks[data.tile.id];
    delete tile.inputMappings;

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
   * @returns string[] list of node ids
   */
  private findPathToNode(startNodeId: any, targetNodeId: any, diagramId: string) {
    let nodes = this.handlers[diagramId].diagram.nodes; // should be parameter?
    let queue = [[startNodeId]];

    while (queue.length > 0) {
      let path = queue.shift();
      let nodeId = path[path.length - 1];

      if (nodeId == targetNodeId) {
        return path;
      }

      let children = nodes[nodeId].children;
      if (children) {
        let paths = children.map(child => path.concat(child));
        queue = queue.concat(paths);
      }

    }

    return [];
  }

  private mapNodesToTiles(nodeIds: any[], from: HandlerInfo) {

    let isApplicableNodeType = _.includes.bind(null, [
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE,
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT,
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW
    ]);

    return nodeIds
      .map(nodeId => {
        let node = from.diagram.nodes[nodeId];
        if (isApplicableNodeType(node.type)) {
          return from.tasks[node.taskID];
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

}
