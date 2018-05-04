import { fromPairs } from 'lodash';
import { ItemTask, Task } from '../interfaces';

export function extractItemInputsFromTask(task: Task): ItemTask['input'] {
  return fromPairs(task.attributes.inputs.map(attr => [attr.name, attr.value]));
}
