import {Component, OnChanges, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { PostService } from '../../../common/services/post.service';
import { TranslateService } from 'ng2-translate/ng2-translate';


import {
  IFlogoFlowDiagramTaskDictionary,
  IFlogoFlowDiagram,
  IFlogoFlowDiagramTask,
  makeDefaultErrorTrigger
} from '../../../common/models';

import { SUB_EVENTS as FLOGO_DIAGRAM_PUB_EVENTS, PUB_EVENTS as FLOGO_DIAGRAM_SUB_EVENTS } from '../../flogo.flows.detail.diagram/messages';
import { SUB_EVENTS as FLOGO_TRIGGERS_PUB_EVENTS, PUB_EVENTS as FLOGO_TRIGGERS_SUB_EVENTS } from '../../flogo.flows.detail.triggers/messages';
import { SUB_EVENTS as FLOGO_ADD_TASKS_PUB_EVENTS, PUB_EVENTS as FLOGO_ADD_TASKS_SUB_EVENTS } from '../../flogo.flows.detail.tasks/messages';
import { SUB_EVENTS as FLOGO_SELECT_TASKS_PUB_EVENTS, PUB_EVENTS as FLOGO_SELECT_TASKS_SUB_EVENTS } from '../../flogo.flows.detail.tasks.detail/messages';
import { PUB_EVENTS as FLOGO_TASK_SUB_EVENTS, SUB_EVENTS as FLOGO_TASK_PUB_EVENTS } from '../../flogo.form-builder/messages'
import { PUB_EVENTS as FLOGO_TRANSFORM_SUB_EVENTS, SUB_EVENTS as FLOGO_TRANSFORM_PUB_EVENTS } from '../../flogo.transform/messages';
import { PUB_EVENTS as FLOGO_ERROR_PANEL_SUB_EVENTS, SUB_EVENTS as FLOGO_ERROR_PANEL_PUB_EVENTS} from '../../flogo.flows.detail.error-panel/messages'

import { RESTAPIService } from '../../../common/services/rest-api.service';
import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import { FLOGO_TASK_TYPE, FLOGO_FLOW_DIAGRAM_NODE_TYPE } from '../../../common/constants';
import {
  flogoIDDecode, flogoIDEncode, flogoGenTaskID, normalizeTaskName, notification,
  attributeTypeToString, flogoGenBranchID, flogoGenTriggerID, updateBranchNodesRunStatus
} from '../../../common/utils';

import { flogoFlowToJSON, triggerFlowToJSON } from '../../flogo.flows.detail.diagram/models/flow.model';
import { FlogoModal } from '../../../common/services/modal.service';

interface HandlerInfo {
  diagram: IFlogoFlowDiagram,
  tasks: IFlogoFlowDiagramTaskDictionary
}

@Component( {
  selector: 'flogo-canvas',
  moduleId: module.id,
  templateUrl: 'canvas.tpl.html',
  styleUrls: [ 'canvas.component.css' ]
} )

export class FlogoCanvasComponent implements OnInit {
  public flow: any;
  public flowId: string;
  public mainHandler:HandlerInfo;
  public errorHandler: HandlerInfo;
  public handlers: { [id:string]: HandlerInfo };
  tasks:any;
  diagram:any;

  _subscriptions : any[];
  _id: any;
  _flowID: string;
  _currentProcessID: string;
  _isCurrentProcessDirty = true;
  _hasUploadedProcess: boolean;
  _uploadingProcess: boolean;
  _startingProcess: boolean;
  _restartingProcess: boolean;
  _steps: any;
  _processInstanceID: string;
  _restartProcessInstanceID: string;
  _isDiagramEdited:boolean;

  // TODO
  //  may need better implementation
  _lastProcessInstanceFromBeginning : any;

  // TODO
  //  Remove this mock
  _mockLoading = true;
  _mockGettingStepsProcess: boolean;
  _mockProcess: any;

  public loading: boolean;
  public isCurrentProcessDirty: boolean = true;
  public mockProcess: any;
  public exportLink: string;
  public downloadLink: string;
  public isInstructionsActivated: boolean  = false;

  constructor(private _postService: PostService,
              private _restAPIService: RESTAPIService,
              private _restAPIFlowsService: RESTAPIFlowsService,
              private _router: Router,
              private _flogoModal: FlogoModal,
              private _route: ActivatedRoute,
              public translate: TranslateService
  ) {
    this._hasUploadedProcess = false ;
    this._isDiagramEdited = false;

    // TODO
    //  Remove this mock
    this._mockLoading = true;

  }

  public ngOnInit() {
      this.flowId = this._route.snapshot.params['id'];

      this.downloadLink = `/v1/api/flows/${this.flowId}/build`;

      this.loading = true;

      try {
        this.flowId = flogoIDDecode(this.flowId);
      } catch (e) {
        console.warn(e);
      }

      this.exportLink = `/v1/api/flows/${this.flowId}/json`;

      this.getFlow(this.flowId)
        .then((res: any)=> {
          this.flow = res.flow;
          this.handlers = {
            'root': res.root,
            'errorHandler': res.errorHandler
          };


          this.tasks = this.handlers['root'].tasks; //  res.root.tasks;
          this.diagram = this.handlers['errorHandler'].diagram; // res.root.diagram;
          this.mainHandler = this.handlers['root'];
          this.errorHandler = this.handlers['errorHandler'];


          this.clearAllRunStatus();

          this.initSubscribe();

          setTimeout(() => {
            this.showInstructions();
          }, 500);

          this._updateFlow(this.flow).then(()=> {
            this.loading = false;
            this._mockLoading = false;
          });

        });
  }

    private changeFlowDetail($event, property) {
        return new Promise((resolve, reject)=> {
            this._updateFlow(this.flow).then((response: any)=> {
                let message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-UPDATE',{value: property});
                 notification(message, 'success', 3000);
                 resolve(response);
            }).catch((err)=> {
                let message = this.translate.instant('CANVAS:ERROR-MESSAGE-UPDATE',{value: property});
                notification(message, 'error');
                reject(err);
            });
        })

  }

  private getFlow(id: string) {
    let diagram: IFlogoFlowDiagram;
    let errorDiagram: IFlogoFlowDiagram;
    let tasks: IFlogoFlowDiagramTaskDictionary;
    let errorTasks: IFlogoFlowDiagramTaskDictionary;
    let flow: any;


    return new Promise((resolve, reject)=> {

      this._restAPIFlowsService.getFlow(id)
          .then(
              (rsp: any)=> {


                if (!_.isEmpty(rsp)) {
                  // initialisation
                  console.group('Initialise canvas component');

                  flow = rsp;

                  tasks = flow.items;
                  if (_.isEmpty(flow.paths)) {
                    diagram = flow.paths = <IFlogoFlowDiagram>{
                      root: {},
                      nodes: {}
                    };
                  } else {
                    diagram = flow.paths;
                  }

                  if (_.isEmpty(flow.errorHandler)) {
                    flow.errorHandler = {paths: {}, items: {}};
                  }

                  errorTasks = flow.errorHandler.items;
                  if (_.isEmpty(flow.errorHandler.paths)) {
                    errorDiagram = flow.errorHandler.paths = <IFlogoFlowDiagram>{
                      root: {},
                      nodes: {}
                    }
                  } else {
                    errorDiagram = flow.errorHandler.paths;
                  }


                }

                resolve({
                  flow,
                  root: {
                    diagram, tasks
                  },
                  errorHandler: {
                    diagram: errorDiagram, tasks: errorTasks
                  }
                });
              }
          )
          .catch(
              (err: any)=> {
                reject(null);
              }
          );

    });
  }

  private initSubscribe() {
    this._subscriptions = [];

    let subs = [
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.addTask, { callback : this._addTaskFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.addTrigger, { callback : this._addTriggerFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.selectTask, { callback : this._selectTaskFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.deleteTask, { callback : this._deleteTaskFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.addBranch, { callback : this._addBranchFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.selectBranch, { callback : this._selectBranchFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.selectTransform, { callback : this._selectTransformFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_DIAGRAM_SUB_EVENTS.selectTrigger, { callback : this._selectTriggerFromDiagram.bind( this ) } ),
      _.assign( {}, FLOGO_TRIGGERS_SUB_EVENTS.addTrigger, { callback : this._addTriggerFromTriggers.bind( this ) } ),
      _.assign( {}, FLOGO_ADD_TASKS_SUB_EVENTS.addTask, { callback : this._addTaskFromTasks.bind( this ) } ),
      _.assign( {}, FLOGO_SELECT_TASKS_SUB_EVENTS.selectTask, { callback : this._selectTaskFromTasks.bind( this ) } ),
      _.assign( {}, FLOGO_TASK_SUB_EVENTS.runFromThisTile, { callback : this._runFromThisTile.bind( this ) } ),
      _.assign( {}, FLOGO_TASK_SUB_EVENTS.runFromTrigger, { callback : this._runFromTriggerinTile.bind( this ) } ),
      _.assign( {}, FLOGO_TASK_SUB_EVENTS.setTaskWarnings, { callback : this._setTaskWarnings.bind( this ) } ),
      _.assign( {}, FLOGO_TRANSFORM_SUB_EVENTS.saveTransform, { callback : this._saveTransformFromTransform.bind( this ) } ),
      _.assign( {}, FLOGO_TRANSFORM_SUB_EVENTS.deleteTransform, { callback : this._deleteTransformFromTransform.bind( this ) } ),
      _.assign( {}, FLOGO_TASK_SUB_EVENTS.taskDetailsChanged, { callback : this._taskDetailsChanged.bind( this ) } ),
      _.assign( {}, FLOGO_TASK_SUB_EVENTS.changeTileDetail, { callback : this._changeTileDetail.bind( this ) } ),
      _.assign( {}, FLOGO_ERROR_PANEL_SUB_EVENTS.openPanel, { callback : this._errorPanelStatusChanged.bind( this, true ) } ),
      _.assign( {}, FLOGO_ERROR_PANEL_SUB_EVENTS.closePanel, { callback : this._errorPanelStatusChanged.bind( this, false ) } ),
    ];

    _.each(
      subs, sub => {
        this._subscriptions.push( this._postService.subscribe( sub ) );
      }
    );
  }

  ngOnDestroy() {
    _.each( this._subscriptions, sub => {
        this._postService.unsubscribe( sub );
      }
    );
  }


  isOnDefaultRoute() {
    console.log(this._router.url);
    return true;
    //this._router.createUrlTree([/]);
    //this._router.isActive()
    //return this._router.isRouteActive(this._router.generate(['FlogoFlowsDetailDefault']));
  }

  // TODO
  //  Remove this mock later
  private _updateMockProcess() {
    if ( !_.isEmpty( this.flow ) ) {
      this._restAPIFlowsService.getFlows()
        .then(
          ( rsp : any ) => {
            this._mockProcess = _.find( rsp, { _id : this.flow._id } );
            this._mockProcess = flogoFlowToJSON( this._mockProcess );
          }
        );
    }
  }

  private _runFromTrigger(data? : any ) {

    this._isDiagramEdited = false;
    let diagramId = 'root';

    if ( this._isCurrentProcessDirty ) {

      return this.uploadProcess()
        .then(
          ( rsp : any ) => {
            if ( !_.isEmpty( rsp ) ) {
              return this.startAndMonitorProcess(diagramId, rsp.id, {
                initData: data
              } );
            } else {
              // the process isn't changed
              return this.startAndMonitorProcess(diagramId, this._currentProcessID, {
                initData: data
              } );
            }
          }
        )
        .then(
          () => {
            // TODO
            //  this is just mock implementation to see the steps result
            return this.mockGetSteps();
          }
        );
    } else {

      return this.startAndMonitorProcess(diagramId, this._currentProcessID, {
        initData: data
      } )
        .then(
          () => {
            // TODO
            //  this is just mock implementation to see the steps result
            return this.mockGetSteps();
          }
        );

    }

  }

  private _runFromRoot(diagramId:string) {
    let currentDiagram = this.handlers[diagramId];

    // The inital data to start the process from trigger
    let initData = _.get( currentDiagram.tasks[currentDiagram.diagram.nodes[currentDiagram.diagram.root.is].taskID], '__props.outputs' );

    this._postService.publish( FLOGO_ERROR_PANEL_PUB_EVENTS.closePanel );

    if ( _.isEmpty( initData ) ) {
      return this._runFromTrigger();
    } else {
      // preprocessing initial data
      initData = _( initData )
          .filter( ( item : any )=> {

            // filter empty values

            return !(<any>_).isNil( item.value );
          } )
          .map( ( item : any ) => {

            // converting the type of the initData from enum to string;

            let outItem = _.cloneDeep( item );

            outItem.type = attributeTypeToString( outItem.type );

            return outItem;
          } );



      return this._runFromTrigger( initData );
    }
  }

  private _updateFlow( flow : any ) {
    this._isCurrentProcessDirty = true;
    function cleanPaths(paths:any) {
      _.each(_.keys(paths), key => {
        if ( key !== 'root' && key !== 'nodes' ) {
          delete paths[ key ];
        }
      });
    }

    // processing this._flow to pure JSON object
    flow = _.cloneDeep( flow );
    cleanPaths(flow.paths);

    if(flow.errorHandler && !_.isEmpty(flow.errorHandler.paths)) {
      cleanPaths(flow.errorHandler.paths);
    }

    flow = JSON.parse( JSON.stringify( flow ) );

    return this._restAPIFlowsService.updateFlow( flow )
      .then(
        ( rsp : any ) => {
          console.log( rsp );
        }
      )
      .then(
        () => {
          // TODO
          //  remove this mock
          return this._updateMockProcess();
        }
      );
  }

  uploadProcess( updateCurrentProcessID = true ) {
    this._uploadingProcess = true;

    // generate process based on the current flow
    let process = flogoFlowToJSON( this.flow );

    //  delete the id of the flow,
    //  since the same process ID returns 204 No Content response and cannot be updated,
    //  while the flow information without ID will be assigned an ID automatically.
    delete process.id;

    return this._restAPIFlowsService.uploadFlow( process ).then((rsp:any) => {

      if (updateCurrentProcessID) {
        this._uploadingProcess = false;
        this._hasUploadedProcess = true;
        this._flowID = rsp.id;
        if ( !_.isEmpty( rsp ) ) {
          this._currentProcessID = rsp.id;
          this._isCurrentProcessDirty = false;
        }
      }

      return rsp;
    });
  }

  startProcess(diagramId : string, id : string, initData? : any ) {
    let currentDiagram = this.handlers[diagramId];
    this._startingProcess = true;
    this._steps = null;

    // clear task status and render the diagram
    this.clearAllRunStatus();


    try { // rootTask should be in DONE status once the flow start
      let rootTask = currentDiagram.tasks[ currentDiagram.diagram.nodes[ currentDiagram.diagram.root.is ].taskID ];
      rootTask.__status['hasRun'] = true;
      rootTask.__status['isRunning'] = false;
    } catch ( e ) {
      console.warn( e );
      console.warn( 'No root task/trigger is found.' );
    }

    this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );

    return this._restAPIFlowsService.startFlow(
        id || this._currentProcessID, initData || []
      )
      .then(
        ( rsp : any )=> {
          this._startingProcess = false;
          this._processInstanceID = rsp.id;

          return rsp;
        }
      )
      .then(
        ( rsp : any ) => {
          console.log( rsp );

          return rsp;
        }
      )
      .catch(
        ( err : any )=> {
          this._startingProcess = false;
          console.error( err );
          throw err;
        }
      );
  }

  startAndMonitorProcess(diagramId:string, processID? : string, opt? : any ) {
    return this.startProcess(diagramId, processID, opt && opt.initData )
      .then(
        ( rsp : any )=> {
          return this.monitorProcessStatus(diagramId, rsp.id, opt );
        }
      )
      .then(
        ( rsp : any )=> {
          return this.updateTaskRunStatus(diagramId);
        }
      )
      .then(
        ( rsp : any )=> {
          return this._restAPIService.instances.getInstance( this._processInstanceID )
        }
      )
      .then(
        ( rsp : any )=> {
          this._lastProcessInstanceFromBeginning = rsp;
          return rsp;
        }
      )
      .catch(
        ( err : any )=> {
          console.error( err );
          // TODO
          //  more specific error message?
          let message = this.translate.instant('CANVAS:ERROR-MESSAGE');
          notification(message,'error');
          return err;
        }
      );
  }

  // monitor the status of a process till it's done or up to the max trials
  monitorProcessStatus(
      diagramId : string,
    processInstanceID? : string,
    opt? : any
  ) : Promise<any> {
    processInstanceID = processInstanceID || this._processInstanceID;
    opt = _.assign(
      {}, {
        maxTrials : 20,
        queryInterval : 500 // ms // TODO change this small polling interval to slow down, this is for evaluating
      }, opt
    );

    // this.clearTaskRunStatus();

    if ( processInstanceID ) {
      let trials = 0;
      let self = this;
      return new Promise(
        ( resolve, reject )=> {
          let processingStatus = { done : false };
          let done = ( timer : any, rsp : any ) => {
            processingStatus.done = true;
            clearInterval( timer );
            return resolve( rsp );
          };

          let stopOnError = ( timer : any, rsp : any ) => {
            processingStatus.done = true;
            clearInterval( timer );
            return reject( rsp );
          };

          let timer = setInterval(
            () => {

              if ( trials > opt.maxTrials ) {
                clearInterval( timer );
                reject( `Reach maximum trial time: ${opt.maxTrials}` );
                return;
              }
              trials++;

              let translator = this.translate;

              self._restAPIService.instances.getStatusByInstanceID( processInstanceID )
                .then(
                  ( rsp : any ) => {
                    ( // logging the response of each trial
                      function ( n : number ) {
                          let message:any = {};

                        switch ( rsp.status ) {
                          case '0':
                            console.log( `[PROC STATE][${n}] Process didn't start.` );
                            break;
                          case '100':
                            console.log( `[PROC STATE][${n}] Process is running...` );
                            self.updateTaskRunStatus(diagramId, rsp.id, processingStatus )
                              .then( ( status : any )=> {
                                console.group( `[PROC STATE][${n}] status` );
                                console.log( status );
                                let isFlowDone = _.get( status, '__status.isFlowDone' );
                                if ( isFlowDone ) {
                                  done( timer, rsp );
                                }
                                console.groupEnd();
                              } )
                              .catch( ( err : any ) => {
                                console.group( `[PROC STATE][${n}] on error` );
                                console.log( err );
                                stopOnError( timer, err );
                                console.groupEnd();
                              } );
                            break;
                          case '500':
                            console.log( `[PROC STATE][${n}] Process finished.` );
                            message = translator.instant('CANVAS:SUCCESS-MESSAGE-COMPLETED');
                            notification(message, 'success', 3000);
                            done( timer, rsp );
                            break;
                          case '600':
                            console.log( `[PROC STATE][${n}] Process has been cancelled.` );
                            message = translator.instant('CANVAS:FLOW-CANCELED');
                            notification(message, 'warning', 3000);
                            done( timer, rsp );
                            break;
                          case '700':
                            console.log( `[PROC STATE][${n}] Process is failed.` );
                            message = translator.instant('CANVAS:ERROR-MESSAGE-FAILED');
                            notification(message, 'error');
                            done( timer, rsp );
                            break;
                          case null :
                            console.log( `[PROC STATE][${n}] Process status is null, retrying...` );
                            break;
                        }

                        // TODO
                        console.log( rsp );

                      }( trials )
                    );
                  }
                );

            }, opt.queryInterval
          );
        }
      );

    } else {
      console.warn( 'No process instance has been logged.' );
      return Promise.reject( 'No process instance has been logged.' );
    }

  }

  clearTaskRunStatus(diagramId:string) {
    if(_.isEmpty(diagramId)) {
      return ;
    }

    let currentDiagram = this.handlers[diagramId];
    const statusToClean = [ 'isRunning', 'hasRun' ];

    _.forIn( currentDiagram.tasks, ( task : any, taskID : string ) => {

      // clear errors
      _.set( task, '__props.errors', [] );

      // ensure the presence of __status
      if ((<any>_).isNil(task.__status)) {
        task.__status = {};
      }

      _.forIn( task.__status, ( status : boolean, key : string ) => {
        if ( statusToClean.indexOf( key ) !== -1 ) {
          task.__status[ key ] = false;
        }
      } );
    } );
  }

  updateTaskRunStatus(diagramId : string, processInstanceID? : string, processingStatus? : {
    done: boolean
  } ) {

    let currentDiagram = this.handlers[diagramId];
    let errorDiagram = this.handlers['errorHandler'];

    processInstanceID = processInstanceID || this._processInstanceID;

    if ( processInstanceID ) {
      return this._restAPIService.instances.getStepsByInstanceID( processInstanceID )
        .then(
          ( rsp : any )=> {
            let isErrorHandlerTouched = false;
            if ( _.has(processingStatus, 'done') && processingStatus.done) {
              // if using processingStatus and the processing status is done,
              // then skip the updating since the previous query may be out-of-date
              console.warn( 'Just logging to know if any query is discarded' );
              return rsp;
            } else {
              let steps = _.get( rsp, 'steps', [] );

              let runTasksIDs = <string[]>[];
              let errors = <{
                [index : string] : {
                  msg : string;
                  time : string;
                }[];
              }>{};
              let isFlowDone = false;
              let runTasks = _.reduce( steps, ( result : any, step : any ) => {
                let taskID = step.taskId;

                if ( taskID !== 1 && !_.isNil( taskID ) ) { // if not rootTask and not `null`

                  taskID = flogoIDEncode( '' + taskID );
                  runTasksIDs.push( taskID );
                  let reAttrName = new RegExp( `^\\[A${step.taskId}\\..*`, 'g' );
                  let reAttrErrMsg = new RegExp( `^\\[A${step.taskId}\\._errorMsg\\]$`, 'g' );

                  let taskInfo = _.reduce( _.get( step, 'flow.attributes', [] ), ( taskInfo : any, attr : any ) => {
                    if ( reAttrName.test( _.get( attr, 'name', '' ) ) ) {
                      taskInfo[ attr.name ] = attr;

                      if ( reAttrErrMsg.test( attr.name ) ) {
                        let errs = <any[]>_.get( errors, `${taskID}` );
                        let shouldOverride = _.isUndefined( errs );
                        errs = errs || [];

                        errs.push( {
                          msg : attr.value,
                          time : new Date().toJSON()
                        } );

                        if ( shouldOverride ) {
                          _.set( errors, `${taskID}`, errs );
                        }
                      }
                    }
                    return taskInfo;
                  }, {} );

                  result[ taskID ] = { attrs : taskInfo };
                } else if ( _.isNull( taskID ) ) {
                  isFlowDone = true;
                }

                return result;
              }, {} );

              _.each(
                runTasksIDs, ( runTaskID : string )=> {
                  let task = currentDiagram.tasks[runTaskID];

                  if(_.isEmpty(task)) {
                    task = errorDiagram.tasks[runTaskID];
                    isErrorHandlerTouched = !!task;
                  }

                  if ( task ) {
                    task.__status['hasRun'] = true;
                    task.__status['isRunning'] = false;

                    let errs = errors[ runTaskID ];
                    if ( !_.isUndefined( errs ) ) {
                      _.set( task, '__props.errors', errs );
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
              updateBranchNodesRunStatus(currentDiagram.diagram.nodes, currentDiagram.tasks);

              if(isErrorHandlerTouched) {
                this._postService.publish( FLOGO_ERROR_PANEL_PUB_EVENTS.openPanel );
              }

              this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );

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

            return rsp;
          }
        );
    } else {
      console.warn( 'No flow has been started.' );
      return Promise.reject( {
        error : {
          message : 'No flow has been started.'
        }
      } );
    }

  }

  // TODO
  //  Remove this mock later
  mockGetSteps() {
    this._mockGettingStepsProcess = true;

    if ( this._processInstanceID ) {
      return this._restAPIService.instances.getStepsByInstanceID( this._processInstanceID )
        .then(
          ( rsp : any ) => {
            this._mockGettingStepsProcess = false;
            this._steps = rsp.steps;
            console.log( rsp );
            return rsp;
          }
        )
        .catch(
          ( err : any )=> {
            this._mockGettingStepsProcess = false;
            console.error( err );
          }
        );
    } else {
      console.warn( 'No process has been started.' );
    }
  }

  trackBySteps( idx : number, s : {id : string, [key : string] : string} ) {
    return s.id;
  }


  clearAllRunStatus()   {
      this.clearTaskRunStatus('root');
      this.clearTaskRunStatus('errorHandler');
  }

  // TODO
  //  to do proper restart process, need to select proper snapshot, hence
  //  the current implementation is only for the last start-from-beginning snapshot, i.e.
  //  the using this._processInstanceID to restart
  restartProcessFrom( diagramId: string,  step : number, newFlowID : string, dataOfInterceptor : string ) {

    if ( this._processInstanceID ) {
      this._restartingProcess = true;
      this._steps = null;

      //this.clearTaskRunStatus(diagramId);
      this.clearAllRunStatus();

      this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );

      return this._restAPIService.flows.restartWithIcptFrom(
        this._processInstanceID, JSON.parse( dataOfInterceptor ), step, this._flowID, newFlowID
        )
        .then(
          ( rsp : any ) => {
            this._restartProcessInstanceID = rsp.id;
            this._restartingProcess = false;

            return rsp;
          }
        )
        .catch(
          ( err : any )=> {
            this._restartingProcess = false;
            console.error( err );
            throw err;
          }
        );
    } else {
      console.warn( 'Should start from trigger for the first time.' );
      return Promise.reject( 'Should start from trigger for the first time.' );
    }
  }


  exportTriggerAndFlow() {
      return this._exportTriggerAndFlow.bind(this);
  }

  private _exportTriggerAndFlow()   {
      let flow = this._exportFlow();
      let trigger = this._exportTrigger();

      return Promise.all([trigger, flow]);
  }

  private _exportFlow() {
    return new Promise((resolve, reject) => {
      let jsonFlow = flogoFlowToJSON( this.flow );
      return resolve({fileName: 'flow.json', data:jsonFlow.flow});
    });
  }

  private _exportTrigger()  {
      return new Promise((resolve, reject) => {
          let jsonTrigger = triggerFlowToJSON(this.flow)
          resolve({fileName:'trigger.json', data:jsonTrigger});
      });
  }

  private _addTriggerFromDiagram( data : any, envelope : any ) {
    console.group( 'Add trigger message from diagram' );

    console.log( data );
    console.log( envelope );

    this._navigateFromModuleRoot(['trigger', 'add'])
      .then(
        () => {
          console.group( 'after navigation' );

          this._postService.publish(
            _.assign(
              {}, FLOGO_TRIGGERS_PUB_EVENTS.addTrigger, {
                data : data
              }
            )
          );

          console.groupEnd();
    });

    console.groupEnd( );
  }

  private _getAllTasks() {
    return _.assign({}, this.handlers['root'].tasks, this.handlers['errorHandler'].tasks  );
  }

  private _addTriggerFromTriggers( data: any, envelope: any) {
    console.group( 'Add trigger message from trigger' );

    console.log( data );
    console.log( envelope );

    // generate trigger id when adding the trigger;
    //  TODO replace the task ID generation function?
    let trigger = <IFlogoFlowDiagramTask> _.assign( {}, data.trigger, { id : flogoGenTriggerID() } );

    let diagramId = data.id;
    let handler = this.handlers[diagramId];

    if(handler == this.errorHandler) {
      trigger.id = flogoGenTaskID( this._getAllTasks() );
    }

    let tasks = handler.tasks;

    tasks[ trigger.id ] = trigger;

    this._navigateFromModuleRoot()
      .then(
        ()=> {
          this._postService.publish(
            _.assign(
              {}, FLOGO_DIAGRAM_PUB_EVENTS.addTrigger, {
                data : {
                  id: data.id,
                  node : data.node,
                  task : trigger
                },
                done : ( diagram : IFlogoFlowDiagram ) => {
                  _.assign( handler.diagram, diagram );
                  this._updateFlow( this.flow );
                  this._isDiagramEdited = true;
                }
              }
            )
          );
        }
      );

    console.groupEnd( );

  }

  private _addTaskFromDiagram( data: any, envelope: any ) {
    console.group( 'Add task message from diagram' );

    console.log( data );
    console.log( envelope );

    this._navigateFromModuleRoot( [ 'task', 'add' ] )
      .then(
        () => {
          console.group( 'after navigation' );

          this._postService.publish(
            _.assign(
              {}, FLOGO_ADD_TASKS_PUB_EVENTS.addTask, {
                data : data
              }
            )
          );

          console.groupEnd();
        });

    console.groupEnd( );
  }

  private _addTaskFromTasks( data: any, envelope: any) {
    let diagramId:string = data.id;
    console.group( 'Add task message from task' );

    console.log( data );
    console.log( envelope );

    let doRegisterTask = _registerTask.bind(this);

    if(this.handlers[diagramId] == this.errorHandler && _.isEmpty(this.errorHandler.tasks)) {
      let errorTrigger = makeDefaultErrorTrigger(flogoGenTaskID(this._getAllTasks()));
      this.errorHandler.tasks[errorTrigger.id] = errorTrigger;

      this._postService.publish(
        _.assign(
          {}, FLOGO_DIAGRAM_PUB_EVENTS.addTask, {
            data : {
              node : null,
              task : errorTrigger,
              id: data.id
            },
            done : ( diagram : IFlogoFlowDiagram ) => {
              _.assign( this.handlers[diagramId].diagram, diagram );
              this._updateFlow( this.flow );
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
      let task = <IFlogoFlowDiagramTask> _.assign( {},
        data.task,
        {
          id : flogoGenTaskID( this._getAllTasks() ),
          name : taskName
        } );

      this.handlers[diagramId].tasks[ task.id ] = task;

      this._navigateFromModuleRoot()
        .then(
          ()=> {
            this._postService.publish(
              _.assign(
                {}, FLOGO_DIAGRAM_PUB_EVENTS.addTask, {
                  data : {
                    node : data.node,
                    task : task,
                    id: data.id
                  },
                  done : ( diagram : IFlogoFlowDiagram ) => {
                    _.assign( this.handlers[diagramId].diagram, diagram );
                    this._updateFlow( this.flow );
                    this._isDiagramEdited = true;
                  }
                }
              )
            );
          }
        );
    }

    console.groupEnd( );

  }


  private _selectTriggerFromDiagram( data: any, envelope: any ) {
    let diagramId:string = data.id;
    //if(!this.raisedByThisDiagram(data.id)) {
    //  return;
    //}

    console.group( 'Select trigger message from diagram' );

    console.log( data );
    console.log( envelope );


    this._navigateFromModuleRoot(['task', data.node.taskID])
      .then(
        () => {
          console.group( 'after navigation' );

          // Refresh task detail
          var currentStep = this._getCurrentState(data.node.taskID);
          var currentTask = _.assign({}, _.cloneDeep( this.handlers[diagramId].tasks[ data.node.taskID ] ) );
          var context     = this._getCurrentContext(data.node.taskID, diagramId);

          this._postService.publish(
            _.assign(
              {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
                data : _.assign( {}, data,
                  { task : currentTask } ,
                  { step: currentStep },
                  { context: context}
                ),
                done: () => {
                  // select task done
                  //  only need this publish if the trigger has been changed
                  this._postService.publish(
                    _.assign(
                      {}, FLOGO_DIAGRAM_PUB_EVENTS.selectTrigger, {
                        data : {
                          node : data.node,
                          task : this.handlers[diagramId].tasks[ data.node.taskID ],
                          id: data.id
                        },
                        done : ( diagram : IFlogoFlowDiagram ) => {
                          _.assign( this.handlers[diagramId].diagram, diagram );
                          // this._updateFlow( this.flow ); // doesn't need to save if only selecting without any change
                        }
                      }
                    )
                  );

                }
              }
            )
          );

          console.groupEnd( );

        }
      );


    console.groupEnd( );
  }

  private _getCurrentContext(taskId:any, diagramId:string) {
    var isTrigger = this.handlers[diagramId].tasks[taskId].type === FLOGO_TASK_TYPE.TASK_ROOT;
    var isBranch = this.handlers[diagramId].tasks[taskId].type  === FLOGO_TASK_TYPE.TASK_BRANCH;
    var isTask = this.handlers[diagramId].tasks[taskId].type  === FLOGO_TASK_TYPE.TASK;

    return {
            isTrigger: isTrigger,
            isBranch: isBranch,
            isTask: isTask,
            hasProcess: !!this._currentProcessID,
            isDiagramEdited: this._isDiagramEdited
    };
  }

  private raisedByThisDiagram(id:string) {
    return this.flow._id === (id || '');
  }


  private _selectTaskFromDiagram( data: any, envelope: any ) {
    let diagramId:string =data.id;

    console.group( 'Select task message from diagram' );
    console.log( data );
    console.log( envelope );


    this._navigateFromModuleRoot(['task', data.node.taskID])
      .then(
        () => {
          console.group( 'after navigation' );

          // Refresh task detail
          var currentStep = this._getCurrentState(data.node.taskID);
          var currentTask = _.assign({}, _.cloneDeep( this.handlers[diagramId].tasks[ data.node.taskID ] ) );
          var context     = this._getCurrentContext(data.node.taskID, diagramId);

          this._postService.publish(
            _.assign(
              {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
                data : _.assign( {},
                                data,
                                { task : currentTask } ,
                                { step: currentStep },
                                { context: context }
                ),

                done: () => {
                  // select task done
                  this._postService.publish(
                    _.assign(
                      {}, FLOGO_DIAGRAM_PUB_EVENTS.selectTask, {
                        data : {
                          node : data.node,
                          task : this.handlers[diagramId].tasks[ data.node.taskID ],
                          id: diagramId
                        },
                        done : ( diagram : IFlogoFlowDiagram ) => {
                          _.assign( this.handlers[diagramId].diagram, diagram );
                          // this._updateFlow( this.flow ); // doesn't need to save if only selecting without any change
                        }
                      }
                    )
                  );

                }
              }
            )
          );

          console.groupEnd( );
        }
      );

    console.groupEnd( );
  }

  // TODO still in use?
  private _selectTaskFromTasks( data: any, envelope: any) {
    console.group( 'Select task message from task' );

    console.log( data );
    console.log( envelope );

    this.tasks[ data.task.id ] = data.task;

    this._navigateFromModuleRoot()
      .then(
        ()=> {
          this._postService.publish(
            _.assign(
              {}, FLOGO_DIAGRAM_PUB_EVENTS.selectTask, {
                data : {
                  node : data.node,
                  task : data.task
                },
                done : ( diagram : IFlogoFlowDiagram ) => {
                  _.assign( this.diagram, diagram );
                  // this._updateFlow( this.flow ); // doesn't need to save if only selecting without any change
                }
              }
            )
          );
        }
      );

    console.groupEnd( );

  }

  // TODO
  //  get step index logic should be based on the selected snapshot,
  //  hence need to be refined in the future
  private _getStepNumberFromSteps(taskId:string) {
    var stepNumber:number = 0;
    // firstly try to get steps from the last process instance running from the beginning,
    // otherwise use some defauts
    let steps = _.get(this._lastProcessInstanceFromBeginning, 'steps', this._steps || []);
    taskId = flogoIDDecode( taskId ); // decode the taskId

    steps.forEach((step:any, index:number) => {
      if(step.taskId == taskId) {
        stepNumber = index + 1;
      }
    });

    return stepNumber;
  }

  private _getCurrentState(taskID:string) {
    var result:any;
    var steps = this._steps || [];

    steps.forEach((current) => {

      let id = taskID;
      try { // try to decode the base64 encoded taskId to number
        id = flogoIDDecode( id );
      } catch ( e ) {
        console.warn( e );
      }

      if(id == current.taskId) {
        result = current;
      }

    });

    return result;
  }

  private _changeTileDetail(data:{
    content: string;
    proper: string;
    taskId: any,
    id:string
  }, envelope:any) {
    var task = this.handlers[data.id].tasks[data.taskId];

    if(task) {
      if(data.proper == 'name') {
        task[data.proper] = this.uniqueTaskName(data.content);
      } else {
        task[data.proper] = data.content;
      }
      this._updateFlow( this.flow ).then(() => {
        this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );
      });
    }
  }

  private _setTaskWarnings(data:any, envelope:any) {
    let diagramId = data.id;
    //if(!this.raisedByThisDiagram(data.id)) {
    //  return;
    //}
    var task = this.handlers[diagramId].tasks[data.taskId];

    if(task) {
      _.set( task, '__props.warnings', data.warnings );

      this._updateFlow( this.flow ).then(() => {
        this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );
      });
    }

  }

  private _runFromThisTile(data:any, envelope:any) {
    let diagramId : string = 'root';
    let currentDiagram = this.handlers[diagramId];

    console.group('Run from this tile');

    let selectedTask = currentDiagram.tasks[ data.taskId ];

    if ( selectedTask.type === FLOGO_TASK_TYPE.TASK_ROOT ) {
      this._runFromRoot(diagramId);
    } else if ( this._processInstanceID ) {
      // run from other than the trigger (root task);

      let step = this._getStepNumberFromSteps( data.taskId );

      if ( step ) {
        // upload a new flow of with the latest flow information
        this.uploadProcess(false).then((rsp:any)=> {
          if (!_.isEmpty(rsp)) {
            let newFlowID = rsp.id;

            let dataOfInterceptor = <any>{
              tasks : <any>[
                {
                  id : parseInt( flogoIDDecode( selectedTask.id ) ),
                  inputs : (function parseInput( d : any ) {
                    let attrs = _.get(selectedTask, 'attributes.inputs');

                    if (attrs) {
                      return _.map(attrs, (input: any)=> {
                        // override the value;
                        return _.assign( _.cloneDeep( input ), {
                          value : d[ input[ 'name' ] ],
                          type : attributeTypeToString( input[ 'type' ] )
                        } );
                      });
                    } else {
                      return [];
                    }
                  }( data.inputs ))
                }
              ]
            };

            this.restartProcessFrom(diagramId, step, newFlowID, JSON.stringify( dataOfInterceptor ) )
              .then( ( rsp : any )=> {
                return this.monitorProcessStatus(diagramId, rsp.id );
              } )
              .then( ( rsp : any )=> {
                return this.updateTaskRunStatus(diagramId, rsp.id );
              } )
              .then( ( rsp : any )=> {

                this._steps = _.get( rsp, 'steps', [] );

                var currentStep = this._getCurrentState( data.taskId );
                var currentTask = _.assign( {}, _.cloneDeep( currentDiagram.tasks[ data.taskId ] ) );
                var context = this._getCurrentContext( data.taskId, diagramId );

                this._postService.publish(
                  _.assign(
                    {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
                      data : _.assign( {},
                        data,
                        { task : currentTask },
                        { step : currentStep },
                        { context : context }
                      )
                    }
                  ) );

              } )
              .then( ()=> {

                if ( _.isFunction( envelope.done ) ) {
                  envelope.done();
                }

              } )
              .catch( ( err : any )=> {
                console.error( err );

                return err;
              } );
          }
        });
      } else {
        // TODO
        console.warn( 'Cannot find proper step to restart from, skipping...' );
      }
    } else {
      // TODO
      //  handling the case that trying to start from the middle of a path without run from the trigger for the first time.
      let task = currentDiagram.tasks[ data.taskId ];
      console.error( `Cannot start from task ${task.name} (${task.id})` );
    }

    console.groupEnd();

  }
  private _runFromTriggerinTile(data: any, envolope: any) {
    let diagramId:string = data.id;
    let currentDiagram:any =  this.handlers[diagramId];

    console.group('Run from Trigger');

    this._runFromRoot(diagramId).then((res) => {
      var currentStep = this._getCurrentState( data.taskId );
      var currentTask = _.assign( {}, _.cloneDeep( currentDiagram.tasks[ data.taskId ] ) );
      var context = this._getCurrentContext( data.taskId, diagramId );

      this._postService.publish(
          _.assign(
              {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
                data : _.assign( {},
                    data,
                    { task : currentTask },
                    { step : currentStep },
                    { context : context }
                )
              }
          ) );
    })
        .catch(
        (err : any )=> {
          console.error( err );
          return err;
        }
    );

    console.groupEnd();
  }

  private _selectTransformFromDiagram(data:any, envelope:any) {
    let diagramId:string = data.id;
    let previousTiles:any;

    let selectedNode = data.node;

    if(diagramId == 'errorHandler') {
      let allPathsMainFlow = this.getAllPaths(this.handlers['root'].diagram.nodes);
      let previousTilesMainFlow = this.mapNodesToTiles(allPathsMainFlow , this.handlers['root']);

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
            tile: _.cloneDeep( this.handlers[diagramId].tasks[selectedTaskId] ),
            id: diagramId
          }
        }
      ));

  }

  private _saveTransformFromTransform(data:any, envelope:any){
    let diagramId:string = data.id;

    // data.tile.taskId
    // data.inputMappings

    let tile = this.handlers[diagramId].tasks[data.tile.id];
    tile.inputMappings = _.cloneDeep(data.inputMappings);

    this._updateFlow( this.flow ).then(() => {
      this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );
    });

  }

  private _deleteTransformFromTransform(data:any, envelope:any){
    let diagramId:string = data.id;

    //if(!this.raisedByThisDiagram(data.id)) {
    //  return;
    //}

    // data.tile.taskId
    let tile = this.handlers[diagramId].tasks[data.tile.id];
    delete tile.inputMappings;

    this._updateFlow( this.flow ).then(() => {
      this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );
    });

  }

  private _deleteTaskFromDiagram( data : any, envelope : any ) {
    let diagramId: string  = data.id;
    //if(!this.raisedByThisDiagram(data.id)) {
    //  return;
    //}
    console.group( 'Delete task message from diagram' );

    console.log(data);
    //data.id = this.flow._id;

    let task = this.handlers[diagramId].tasks[ _.get( data, 'node.taskID', '' ) ];
    let node = this.handlers[diagramId].diagram.nodes[ _.get( data, 'node.id', '' ) ];
    let _diagram = this.handlers[diagramId].diagram;

    // TODO
    //  refine confirmation
    //  delete trigger isn't hanlded
    if ( node.type !== FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT && task) {
      this._flogoModal.confirmDelete('Are you sure you want to delete this task?').then((res) => {
        if(res) {

          // clear details panel, if the selected activity is deleted
          // verify if should jump back to detail page before sending delete message
          let _shouldGoBack = false;
          let parsedURL = location.pathname.split( 'task/' );
          if ( parsedURL.length === 2 && _.isString( parsedURL[ 1 ] ) ) {

            let currentTaskID = parsedURL[ 1 ];
            let deletingTaskID = _.get( data, 'node.taskID', '' );

            // if the current task ID in the URL is the deleting task, or
            // if the deleting task has branches or itself is branch, and the current task is in one of the branches
            // navigate to the flow default view
            if ( currentTaskID === deletingTaskID || // if the current task ID in the URL is the deleting task

              // if the deleting task has branches or itself is branch, and the current task is in one of the branches
              ((_.some( _.get( data, 'node.children', [] ), ( nodeId : string )=> {

                // try to find children of NODE_BRANCH type
                return _diagram.nodes[ nodeId ].type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH;

              } ) || _.get( data, 'node.type' ) === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH)
              && (function isTaskIsChildOf( taskID : string, parentNode : any, isInBranch = false ) : boolean {

                // traversal the downstream task
                let children = _.get( parentNode, 'children', [] );

                if ( parentNode.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
                  isInBranch = true;
                }

                if ( taskID === _.get( parentNode, 'taskID' ) ) {
                  return isInBranch; // if in branch, then should go back, otherwise ignore
                } else if ( children.length === 0 ) { // no child
                  return false;
                } else { // resursive call to the next level
                  return _.some( children, ( childID : string )=> {
                    return isTaskIsChildOf( taskID, _diagram.nodes[ childID ], isInBranch );
                  } );
                }

              }( currentTaskID, data.node ))) ) {
              _shouldGoBack = true;
            }
          }

          this._postService.publish(
              _.assign(
                  {}, FLOGO_DIAGRAM_PUB_EVENTS.deleteTask, {
                    data : {
                      node : data.node,
                      id: diagramId
                    },
                    done : ( diagram : IFlogoFlowDiagram ) => {
                      // TODO
                      //  NOTE that once delete branch, not only single task is removed.
                      delete this.handlers[diagramId].tasks[ _.get( data, 'node.taskID', '' ) ];
                      _.assign( this.handlers[diagramId].diagram, diagram );
                      this._updateFlow( this.flow );
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

  private _errorPanelStatusChanged(isOpened: boolean, data: any, envelope: any) {

    console.group('Close/open error panel from error panel');

    // clean selection status

    let allNodes = _.reduce(this.handlers, (allNodes, handle) => {
      return _.assign(allNodes, _.get(handle, 'diagram.nodesOfAddType', {}), _.get(handle, 'diagram.nodes', {}));
    }, {});
    _.forEach(allNodes, node => _.set(node, '__status.isSelected', false));

    this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );

    this._navigateFromModuleRoot();

    console.groupEnd();

  }

  private _addBranchFromDiagram( data : any, envelope : any ) {
    let diagramId:string = data.id;
    //if(!this.raisedByThisDiagram(data.id)) {
    //  return;
    //}
    console.group( 'Add branch message from diagram' );
    console.log( data );

    // TODO
    //  remove this mock later
    //    here just creating a branch node with new branch info

    let branchInfo = {
      id : flogoGenBranchID(),
      type : FLOGO_TASK_TYPE.TASK_BRANCH,
      condition : 'true'
    };

    this.handlers[diagramId].tasks[ branchInfo.id ] = branchInfo;

    this._postService.publish( _.assign( {}, FLOGO_DIAGRAM_PUB_EVENTS.addBranch, {
      data : {
        node : data.node,
        task : branchInfo,
        id: diagramId
      },
      done : ( diagram : IFlogoFlowDiagram ) => {
        _.assign( this.handlers[diagramId].diagram, diagram );
        this._updateFlow( this.flow );
      }
    } ) );

    console.groupEnd();
  }

  private _selectBranchFromDiagram( data : any, envelope : any ) {
    let diagramId:string = data.id;
    console.group( 'Select branch message from diagram' );

    console.log( data );

    // TODO
    //  reference to _selectTaskFromDiagram
    //  may need to route to some other URL?
    var currentStep = this._getCurrentState(data.node.taskID);
    var currentTask = _.assign({}, _.cloneDeep( this.handlers[diagramId].tasks[ data.node.taskID ] ) );
    var context     = this._getCurrentContext(data.node.taskID, diagramId);

    let selectedNode = data.node;
    let previousNodes = this.findPathToNode(this.handlers[diagramId].diagram.root.is, selectedNode.id, diagramId);
    previousNodes.pop(); // ignore last item as it is the very same selected node
    let previousTiles = this.mapNodesToTiles(previousNodes, this.handlers[diagramId]);

    this._navigateFromModuleRoot([ 'task', data.node.taskID ])
      .then(
        () => {
          console.group('after navigation');

          this._postService.publish(
            _.assign(
              {}, FLOGO_SELECT_TASKS_PUB_EVENTS.selectTask, {
                data: _.assign({},
                  data,
                  {task: currentTask},
                  {step: currentStep},
                  {
                    context : _.assign( context, {
                      contextData : {
                        previousTiles : previousTiles
                      }
                    } )
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
                        done: (diagram:IFlogoFlowDiagram) => {
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

          console.groupEnd( );
        }
  );

    console.groupEnd();
  }

  private uniqueTaskName(taskName:string) {
    // TODO for performance pre-normalize and store task names?
    let newNormalizedName = normalizeTaskName(taskName);

    //All activities are gathered in one variable
    let allTasks = _.reduce(this.handlers, (all:any, current:any) => _.assign(all, current.tasks), {});

    //search for the greatest index in all the flow
    let greatestIndex = _.reduce(allTasks, (greatest:number, task:any) => {
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

  private getAllPaths(nodes:any) {
    return Object.keys(nodes);
  }

  /**
   * Finds a path from starting node to target node
   * Assumes we have a tree structure, meaning we have no cycles
   * @param {string} startNodeId
   * @param {string} targetNodeId
   * @returns string[] list of node ids
     */
  private findPathToNode(startNodeId:any, targetNodeId:any, diagramId:string) {
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

  private mapNodesToTiles(nodeIds:any[], from:HandlerInfo) {

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

  private _updateAttributesChanges(task:any,changedInputs:any, structure:any) {

    for(var name in changedInputs) {
      var attributes = _.get(task, structure, []);

      attributes.forEach((input)=> {
        if(input.name === name) {
          input['value'] =  changedInputs[name];
        }
      });
    }

  }

  private _taskDetailsChanged(data:any, envelope:any) {
    let diagramId = data.id;

    //if(!this.raisedByThisDiagram(data.id)) {
    //  return;
    //}

    console.group('Save task details to flow');
    var task = this.handlers[diagramId].tasks[data.taskId];

    if (task.type === FLOGO_TASK_TYPE.TASK) { // TODO handle more activity task types in the future
      // set/unset the warnings in the tile
      _.set( task, '__props.warnings', data.warnings );

      var changedInputs = data.inputs || {};
      this._updateAttributesChanges(task, changedInputs, 'attributes.inputs');

      /*
      for(var name in changedInputs) {
        task.attributes.inputs.forEach((input)=> {
          if(input.name === name) {
            input.value =  changedInputs[name];
          }
        });
       }
      */
    } else if (task.type === FLOGO_TASK_TYPE.TASK_ROOT) { // trigger

      this._updateAttributesChanges(task, data.settings, 'settings');
      this._updateAttributesChanges(task, data.endpointSettings, 'endpoint.settings');
      this._updateAttributesChanges(task, data.outputs, 'outputs');

      // ensure the persence of the internal properties
      task.__props = task.__props || {};

      // cache the outputs mock of a trigger, to be used as initial data when start/restart the flow.
      task.__props[ 'outputs' ] = _.map( _.get( task, 'outputs', [] ), ( output : any )=> {
        let newValue = data.outputs[ output.name ];

        // undefined is invalid default value, hence filter that out.
        if ( output && !_.isUndefined( newValue ) ) {
          output.value = newValue;
        }

        return output;
      } );
    } else if ( task.type === FLOGO_TASK_TYPE.TASK_BRANCH ) { // branch
      task.condition = data.condition;
    }

    if ( _.isFunction( envelope.done ) ) {
      envelope.done();
    }

    //this._updateFlow( this.flow );
    this._updateFlow( this.flow ).then(() => {
      this._postService.publish( FLOGO_DIAGRAM_PUB_EVENTS.render );
    });

    console.groupEnd();
  }

  /**
   *
   * @param urlParts empty to navigate to module root
   * @returns {Promise<boolean>}
   * @private
   */
  private _navigateFromModuleRoot(urlParts = []) {
    return this._router.navigate( [ '/flows', flogoIDEncode(this.flowId), ...urlParts ] );
  }

  showInstructions() {
    let instructions:any = localStorage.getItem('flogo-show-instructions');
    if(_.isEmpty(instructions)) {
      localStorage.setItem('flogo-show-instructions', new Date().toString());
      this.isInstructionsActivated = true;
    }
    return this.isInstructionsActivated;
  }

  public onClosedInstructions(closed) {
      this.isInstructionsActivated = false;
  }

  public activateInstructions() {
      this.isInstructionsActivated = true;
  }


}
