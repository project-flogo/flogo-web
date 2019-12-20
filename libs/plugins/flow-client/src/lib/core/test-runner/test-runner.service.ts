import {
  assign,
  cloneDeep,
  get,
  isEmpty,
  isUndefined,
  map as _map,
  mapValues,
  noop,
  reduce,
  set,
  pickBy,
} from 'lodash';
import { Observable, Subject, throwError } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';

import { ActivitySchema } from '@flogo-web/core';
import {
  Dictionary,
  FlowGraph,
  GraphNode,
  Interceptor,
  NodeType,
  OperationalError,
  RunTaskStatusCode,
} from '@flogo-web/lib-client/core';
import { NotificationsService } from '@flogo-web/lib-client/notifications';
import { LanguageService } from '@flogo-web/lib-client/language';

import { ItemActivityTask } from '../interfaces/flow';
import { FlowActions, FlowSelectors } from '../state';
import { isBranchExecuted } from '../models/flow/branch-execution-status';
import { logRunStatus } from './log-run-status';
import { FlowState } from '../state';
import {
  RunOrchestratorService,
  ERRORS as RUNNER_ERRORS,
  RunProgress,
  RunProgressStore,
  RunStatusCode as RUNNER_STATUS,
  Step,
  StepFlowType,
} from './run-orchestrator.service';
import { createRunOptionsForRoot } from './create-run-options-for-root';
import { taskIdsOfCurrentStep } from './taskids-current-step';

const ERROR_MSG_ATTRIBUTE_PATTERN = new RegExp(`^_E.`, 'g');

const fineDoneTaskIdInStep = (step: Step) => {
  const tasksStatuses =
    step && step.flowChanges && step.flowChanges[0] && step.flowChanges[0].tasks;
  if (!tasksStatuses) {
    return -1;
  }
  for (const [taskId, { status }] of Object.entries(tasksStatuses)) {
    if (status === RunTaskStatusCode.Done) {
      return taskId;
    }
  }
  return -1;
};

@Injectable()
export class TestRunnerService implements OnDestroy {
  private contextChange = new Subject<void>();
  private runState = {
    // TODO: may need better implementation
    lastProcessInstanceFromBeginning: <any>null,
    steps: <Step[]>null,
  };

  constructor(
    private store: Store<FlowState>,
    private orchestrator: RunOrchestratorService,
    private translate: LanguageService,
    private notificationsService: NotificationsService
  ) {}

  runFromRoot() {
    this.contextChange.next();
    this.store.dispatch(new FlowActions.RunFromStart());
    return this._runFromRoot();
  }

  runFromTask(options: { taskId: string; inputs: any }) {
    this.contextChange.next();
    return this._runFromThisTile(options);
  }

  getCurrentRunState() {
    return this.runState;
  }

  ngOnDestroy() {
    this.contextChange.next();
    this.contextChange.complete();
  }

  private _runFromRoot() {
    this.store.dispatch(new FlowActions.RunFromStart());
    return this.getFlowStateOnce().pipe(
      takeUntil(this.contextChange),
      map((flowState: FlowState) => {
        this.runState.steps = null;
        const runOptions = createRunOptionsForRoot(flowState);
        return this.orchestrator.runFromRoot(runOptions);
      }),
      tap(runner => {
        this.observeProcessRegistration(runner);
      }),
      switchMap(runner => this.observeRunProgress(runner)),
      tap((runState: RunProgress) => {
        this.runState.lastProcessInstanceFromBeginning = runState.lastInstance;
      }),
      catchError(err => this.handleRunError(err))
    );
  }

  // TODO
  //  to do proper restart process, need to select proper snapshot, hence
  //  the current implementation is only for the last start-from-beginning snapshot, i.e.
  //  the using this.runState.processInstanceId to restart
  private _runFromThisTile({ inputs, taskId }) {
    console.group('Run from this tile');
    return this.getFlowStateOnce().pipe(
      map((flowState: FlowState) => {
        const selectedTask = flowState.mainItems[taskId] as ItemActivityTask;
        const schema = flowState.schemas[selectedTask.ref] as ActivitySchema;
        if (!flowState.lastFullExecution.processId) {
          // run from other than the trigger (root task);
          // TODO
          throw new Error('Cannot find proper step to restart from, skipping...');
        }

        const stepNumber = this.getStepNumberFromSteps(taskId);
        if (stepNumber < 0) {
          // TODO
          //  handling the case that trying to start from the middle of a path without run from the trigger for the first time.
          throw new Error(
            `Cannot start from task ${(<any>selectedTask).name} (${selectedTask.id})`
          );
        }

        this.store.dispatch(new FlowActions.RunFromTask());
        const dataOfInterceptor: Interceptor = {
          tasks: [
            {
              id: selectedTask.id,
              inputs: mergeInputAndSchema(schema.inputs, inputs),
            },
          ],
        };
        this.runState.steps = null;

        return this.orchestrator.rerun({
          useFlowId: flowState.id,
          interceptor: dataOfInterceptor,
          step: stepNumber,
          instanceId: flowState.lastFullExecution.instanceId,
        });
      }),
      switchMap(runner => this.observeRunProgress(runner)),
      catchError(err => this.handleRunError(err))
    );

    function mergeInputAndSchema(schemaInput: any, inputData: any) {
      if (!schemaInput) {
        return [];
      }
      return _map(schemaInput, (input: any) => {
        // override the value;
        return assign(cloneDeep(input), {
          value: inputData[input.name],
          type: input.type,
        });
      });
    }
  }

  // TODO
  //  get step index logic should be based on the selected snapshot,
  //  hence need to be refined in the future
  private getStepNumberFromSteps(taskId: string) {
    // try to get steps from the last process instance running from the beginning,
    // otherwise use some defaults
    const steps: Step[] = get(
      this.runState.lastProcessInstanceFromBeginning,
      'steps',
      this.runState.steps || []
    );

    return steps.findIndex(step => {
      const doneTaskId = fineDoneTaskIdInStep(step);
      /* tslint:disable-next-line:triple-equals - allowing double equals for legacy ids that were of type number */
      return doneTaskId == taskId;
    });
  }

  // monitor the status of a process util it's done or up to the max trials
  private observeRunProgress(runner: RunProgressStore): Observable<RunProgress | void> {
    // TODO: remove noop when fixed https://github.com/ReactiveX/rxjs/issues/2180
    runner.processStatus
      .pipe(takeUntil(this.contextChange))
      .subscribe(processStatus => logRunStatus(processStatus), noop);

    // TODO: only on run from trigger?
    runner.registered.pipe(takeUntil(this.contextChange)).subscribe(info => {
      this.store.dispatch(new FlowActions.NewExecutionRegistered());
    }, noop); // TODO: remove when fixed https://github.com/ReactiveX/rxjs/issues/2180);

    runner.steps
      .pipe(
        takeUntil(this.contextChange),
        filter(steps => {
          return !!steps;
        }),
        mergeMap(steps =>
          this.getFlowStateOnce().pipe(
            map(flowState => this.updateTaskRunStatus(flowState, steps, {}))
          )
        )
      )
      .subscribe(noop, noop); // TODO: remove when fixed https://github.com/ReactiveX/rxjs/issues/2180

    return runner.completed.pipe(
      takeUntil(this.contextChange),
      tap((state: RunProgress) => {
        this.runState.steps = state.steps;
        const message = this.translate.instant('CANVAS:SUCCESS-MESSAGE-COMPLETED');
        this.notificationsService.success(message);
      })
    );
  }

  private getFlowStateOnce(): Observable<FlowState> {
    return this.store.pipe(
      select(FlowSelectors.selectFlowState),
      take(1)
    );
  }

  private handleRunError(error) {
    console.error(error);
    // todo: more specific error message?
    let msgKey = null;
    if (error.isOperational) {
      const opError = <OperationalError>error;
      if (opError.name === RUNNER_ERRORS.PROCESS_NOT_COMPLETED) {
        // run error instance has status prop hence the casting to any
        msgKey =
          (<any>opError).status === RUNNER_STATUS.Cancelled
            ? 'CANVAS:RUN-ERROR:RUN-CANCELLED'
            : 'CANVAS:RUN-ERROR:RUN-FAILED';
      } else if (opError.name === RUNNER_ERRORS.MAX_TRIALS_REACHED) {
        msgKey = 'CANVAS:RUN-ERROR:MAX-REACHED';
      }
    }

    msgKey = msgKey || 'CANVAS:ERROR-MESSAGE';
    this.notificationsService.error({ key: msgKey });
    return throwError(error);
  }

  private observeProcessRegistration(runner: RunProgressStore) {
    runner.registered.subscribe(({ processId, instanceId }) => {
      this.store.dispatch(
        new FlowActions.NewRunFromStartProcess({ processId, instanceId })
      );
    }, noop); // TODO: remove when fixed https://github.com/ReactiveX/rxjs/issues/2180);
  }

  private updateTaskRunStatus(flowState: FlowState, steps: Step[], rsp: any) {
    let isErrorHandlerTouched = false;
    const { isFlowDone, runTasks, runTaskIds, errors } = this.extractExecutionStatus(
      steps
    );

    let allStatusChanges = {
      mainGraphNodes: {} as Dictionary<GraphNode>,
      errorGraphNodes: {} as Dictionary<GraphNode>,
    };

    runTaskIds.forEach(taskId => {
      let node = flowState.mainGraph.nodes[taskId];
      let changeAccumulator = allStatusChanges.mainGraphNodes;
      if (isEmpty(node)) {
        node = flowState.errorGraph.nodes[taskId];
        changeAccumulator = allStatusChanges.errorGraphNodes;
        isErrorHandlerTouched = !!node;
      }
      if (node) {
        const taskErrors = errors[node.id];
        changeAccumulator[node.id] = {
          ...node,
          status: {
            ...node.status,
            executed: true,
            executionErrored: !isUndefined(taskErrors)
              ? Object.values(taskErrors).map(err => err.msg)
              : null,
          },
        };
      }
    });

    const filterBranches = (nodes: Dictionary<GraphNode>) =>
      [...Object.values(nodes)].filter(node => node.type === NodeType.Branch);
    const branchUpdates = (nodes: FlowGraph['nodes']) =>
      filterBranches(nodes).reduce((changes, branchNode) => {
        const branchWasExecuted = isBranchExecuted(branchNode, nodes);
        if (branchWasExecuted && !nodes[branchNode.id].status.executed) {
          changes[branchNode.id] = {
            ...branchNode,
            status: {
              ...branchNode.status,
              executed: true,
            },
          };
        }
        return changes;
      }, {});

    allStatusChanges = {
      mainGraphNodes: {
        ...allStatusChanges.mainGraphNodes,
        ...branchUpdates({
          ...flowState.mainGraph.nodes,
          ...allStatusChanges.mainGraphNodes,
        }),
      },
      errorGraphNodes: {
        ...allStatusChanges.errorGraphNodes,
        ...branchUpdates({
          ...flowState.errorGraph.nodes,
          ...allStatusChanges.errorGraphNodes,
        }),
      },
    };

    set(rsp, '__status', {
      isFlowDone: isFlowDone,
      errors: errors,
      runTasks: runTasks,
      runTasksIDs: runTaskIds,
    });

    this.store.dispatch(
      new FlowActions.ExecutionStateUpdated({ changes: allStatusChanges })
    );
    this.store.dispatch(
      new FlowActions.ExecutionStepsUpdated({
        steps: mapValues(runTasks, task => task.attrs),
      })
    );

    // when the flow is done on error, throw an error
    // the error is the response with `__status` provisioned.
    if (isFlowDone && !isEmpty(errors)) {
      throw rsp;
    }

    // TODO
    //  how to verify if a task is running?
    //    should be the next task downstream the last running task
    //    but need to find the node of that task in the diagram
  }

  private extractExecutionStatus(steps: Step[]) {
    let isFlowDone = false;
    const runTaskIds = [];
    const errors = <
      {
        [index: string]: {
          msg: string;
          time: string;
        }[];
      }
    >{};
    const runTasks = reduce(
      steps,
      (result: any, step: Step) => {
        const flowChanges = step && step.flowChanges;
        const mainFlowChanges = flowChanges && flowChanges[StepFlowType.MainFlow];
        if (mainFlowChanges) {
          const executedTasks = taskIdsOfCurrentStep(mainFlowChanges.tasks);
          const flowInstanceStatus = mainFlowChanges.status.toString();

          if (flowInstanceStatus === RUNNER_STATUS.Completed) {
            isFlowDone = true;
          }

          executedTasks.forEach((taskId: string) => {
            const { attrs: stepAttrs } = mainFlowChanges;
            const attrs = pickBy(
              stepAttrs,
              (attrVal, attrKey) => !ERROR_MSG_ATTRIBUTE_PATTERN.test(attrKey)
            );
            const errorAttrs = pickBy(stepAttrs, (attrVal, attrKey) =>
              ERROR_MSG_ATTRIBUTE_PATTERN.test(attrKey)
            );
            Object.values(errorAttrs).forEach(errValue => {
              let errs = <any[]>get(errors, `${taskId}`);
              const isNewEntry = isUndefined(errs);
              errs = errs || [];

              errs.push({
                msg: errValue && errValue.message,
                time: new Date().toJSON(),
              });

              if (isNewEntry) {
                set(errors, `${taskId}`, errs);
              }
            });
            runTaskIds.push(taskId);
            result[taskId] = { attrs };
          });
        }
        return result;
      },
      {}
    );
    return { isFlowDone, runTasks, runTaskIds, errors };
  }
}
