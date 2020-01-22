import { isEmpty, fromPairs } from 'lodash';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, pipe } from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';

import { ActivitySchema } from '@flogo-web/core';
import {
  Dictionary,
  StepAttribute,
  SingleEmissionSubject,
} from '@flogo-web/lib-client/core';

import { isMapperActivity } from '@flogo-web/plugins/flow-core';
import { FlowSelectors, FlowState } from '../core/state';
import { TestRunnerService } from '../core/test-runner/test-runner.service';
import { ItemActivityTask } from '../core/interfaces/flow';

import { FormBuilderService } from '../shared/dynamic-form';
import { createSaveChangesAction } from './save-changes-action.creator';
import { debugPanelAnimations } from './debug-panel.animations';
import { mergeFormWithOutputs } from './utils';
import { FieldsInfo } from './fields-info';
import { DebugActivityTask, combineToDebugActivity } from './debug-activity-task';

const mapFormInputChangesToSaveAction = (
  store,
  activity$: Observable<ItemActivityTask>
) =>
  pipe(
    filter((formInfo: FieldsInfo) =>
      Boolean(formInfo && formInfo.form && formInfo.form.get('input'))
    ),
    switchMap((formInfo: FieldsInfo) =>
      formInfo.form.get('input').valueChanges.pipe(debounceTime(250))
    ),
    map(value => fromPairs(value.formFields.map(field => [field.name, field.value]))),
    withLatestFrom(activity$),
    switchMap(([newValues, task]) => createSaveChangesAction(store, task.id, newValues)),
    filter(action => !!action)
  );

@Component({
  selector: 'flogo-flow-debug-panel',
  templateUrl: './debug-panel.component.html',
  styleUrls: ['./debug-panel.component.less'],
  animations: [
    debugPanelAnimations.panelContainer,
    debugPanelAnimations.panel,
    debugPanelAnimations.wrappedContent,
  ],
})
export class DebugPanelComponent implements OnInit, OnDestroy {
  @ViewChild('content', { static: true }) content: ElementRef;
  activity$: Observable<DebugActivityTask>;
  fields$: Observable<FieldsInfo>;
  isRunDisabled$: Observable<boolean>;
  activityHasRun$: Observable<boolean>;
  executionErrors: Array<string>;
  isEndOfFlow$: Observable<boolean>;
  isRestartableTask$: Observable<boolean>;

  private destroy$ = SingleEmissionSubject.create();

  constructor(
    private store: Store<FlowState>,
    private formBuilder: FormBuilder,
    private attributeFormBuilder: FormBuilderService,
    private testRunner: TestRunnerService
  ) {}

  ngOnInit() {
    const selectAndShare = selector =>
      this.store.pipe(
        select(selector),
        shareReplay(1)
      );
    this.isRunDisabled$ = selectAndShare(
      FlowSelectors.getIsRunDisabledForSelectedActivity
    );

    selectAndShare(FlowSelectors.getCurrentActivityExecutionErrors)
      .pipe(takeUntil(this.destroy$))
      .subscribe(executionErrors => (this.executionErrors = executionErrors));

    this.isRestartableTask$ = selectAndShare(FlowSelectors.getIsRestartableTask);
    const schema$ = selectAndShare(FlowSelectors.getSelectedActivitySchema);
    const selectedActivity$ = selectAndShare(FlowSelectors.getSelectedActivity);
    this.activity$ = combineLatest([schema$, selectedActivity$]).pipe(
      combineToDebugActivity(),
      shareReplay(1),
      takeUntil(this.destroy$)
    );
    this.isEndOfFlow$ = schema$.pipe(map(isMapperActivity));
    const form$: Observable<null | FieldsInfo> = schema$.pipe(
      this.mapStateToForm(),
      shareReplay(1),
      takeUntil(this.destroy$)
    );
    const executionResult$ = selectAndShare(
      FlowSelectors.getSelectedActivityExecutionResult
    );
    this.activityHasRun$ = executionResult$.pipe(
      map(Boolean),
      takeUntil(this.destroy$)
    );
    this.fields$ = combineLatest([form$, selectedActivity$, executionResult$]).pipe(
      this.mergeToFormFields(),
      shareReplay(1),
      takeUntil(this.destroy$)
    );
    form$
      .pipe(
        mapFormInputChangesToSaveAction(this.store, selectedActivity$),
        takeUntil(this.destroy$)
      )
      .subscribe(action => this.store.dispatch(action));
  }

  ngOnDestroy() {
    this.destroy$.emitAndComplete();
  }

  run() {
    this.activity$
      .pipe(
        take(1),
        switchMap(task =>
          this.testRunner.runFromTask({ taskId: task.id, inputs: task.input })
        )
      )
      .subscribe();
  }

  private mapStateToForm() {
    return pipe(map((schema: ActivitySchema) => this.createFormFromSchema(schema)));
  }

  private mergeToFormFields() {
    return (
      source: Observable<[FieldsInfo, ItemActivityTask, Dictionary<StepAttribute>]>
    ) =>
      source.pipe(
        filter(([schemaForm]) => !!schemaForm),
        map(([schemaForm, activity, lastExecutionResult]) => {
          const inputForm = schemaForm && schemaForm.form.get('input');
          if (inputForm && activity) {
            this.mergeFormWithInputs(inputForm, activity);
          }
          return {
            form: mergeFormWithOutputs(schemaForm.form, lastExecutionResult, activity.id),
            metadata: schemaForm && schemaForm.metadata,
          };
        })
      );
  }

  private mergeFormWithInputs(inputForm: AbstractControl, activity: ItemActivityTask) {
    const mockInputs = activity.input || {};
    const formFieldValues = inputForm.value.formFields.map(fieldVal => {
      const mockValue = mockInputs[fieldVal.name] || null;
      return {
        ...fieldVal,
        value: mockValue,
      };
    });
    inputForm.patchValue({ formFields: formFieldValues }, { emitEvent: false });
    return inputForm;
  }

  private createFormFromSchema(schema: ActivitySchema) {
    if (!schema) {
      return null;
    }
    const inputs = !isEmpty(schema.inputs)
      ? this.attributeFormBuilder.toFormGroup(schema.inputs)
      : null;
    const outputs = !isEmpty(schema.outputs)
      ? this.attributeFormBuilder.toFormGroup(schema.outputs)
      : null;
    const form = this.formBuilder.group({});
    if (inputs) {
      form.addControl('input', inputs.formGroup);
    }
    if (outputs) {
      outputs.formGroup.disable();
      form.addControl('output', outputs.formGroup);
    }
    return {
      form,
      metadata: {
        input: inputs && inputs.fieldsWithControlType,
        output: outputs && outputs.fieldsWithControlType,
      },
    };
  }
}
