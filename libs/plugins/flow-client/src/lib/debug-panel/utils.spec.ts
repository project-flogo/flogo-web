import { matchFormWithExecutionResult, mergeFormWithOutputs } from './utils';
import { FormControl, FormGroup } from '@angular/forms';

describe('debug-panel.utils.matchFormWithExecutionResult()', function() {
  it('should match the execution result with the form values', function() {
    expect(
      matchFormWithExecutionResult(
        {
          '_A.something_1.message': 'foo',
          '_A.something_1.otherval': 33,
        },
        [
          { name: 'otherval', value: 'wrong' },
          { name: 'message', value: 'wrong' },
          { name: 'notFound', value: 'hello' },
        ],
        'something_1'
      )
    ).toEqual([
      { name: 'otherval', value: 33 },
      { name: 'message', value: 'foo' },
      { name: 'notFound', value: null },
    ]);
  });
});

describe('debug-panel.utils.mergeFormWithOutputs()', function() {
  it('should not try to update the form if there are no outputs', function() {
    const formGroup: Partial<FormGroup> = {
      get() {
        return null;
      },
    };
    expect(() => mergeFormWithOutputs(formGroup as FormGroup, {}, '')).not.toThrowError();
  });

  it('should not try to update the form if there are no executionResults', function() {
    const outputGroup: Partial<FormControl> = {
      patchValue() {},
    };
    const formGroup: Partial<FormGroup> = {
      get() {
        return outputGroup as FormControl;
      },
    };
    spyOn(outputGroup, 'patchValue');
    mergeFormWithOutputs(formGroup as FormGroup, null, '');
    expect(outputGroup.patchValue).not.toHaveBeenCalled();
  });

  it('should update the form if there are outputs and if there is an execution result available', function() {
    const outputGroup: Partial<FormControl> = {
      value: [],
      patchValue() {},
    };
    const formGroup: Partial<FormGroup> = {
      get() {
        return outputGroup as FormControl;
      },
    };
    spyOn(outputGroup, 'patchValue');

    mergeFormWithOutputs(formGroup as FormGroup, {}, '');
    expect(outputGroup.patchValue).toHaveBeenCalled();
  });
});
