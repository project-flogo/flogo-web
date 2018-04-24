import { cloneDeep } from 'lodash';
import { ItemTask, ActivitySchema, Task } from '../interfaces';
import { TaskAttribute } from '@flogo/core';

export function mergeItemWithSchema(item: ItemTask, schema: ActivitySchema): Task {
  item = cloneDeep(item);
  schema = cloneDeep(schema);
  const itemInput = item.input || {};
  const schemaInputs = schema.inputs || [];
  const inputs = schemaInputs.map(input => {
    const value = itemInput[input.name];
    return { ...input, value };
  });
  return {
    id: item.id,
    type: item.type,
    version: schema.version,
    name: item.name,
    activityRef: item.ref,
    ref: item.ref,
    description: item.description,
    attributes: {
      inputs,
      outputs: <TaskAttribute[]> schema.outputs,
    },
    inputMappings: item.inputMappings,
    settings: item.settings,
    __props: item.__props,
    __status: item.__status
  };
}
