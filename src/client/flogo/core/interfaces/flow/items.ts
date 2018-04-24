import { FLOGO_TASK_TYPE } from '../../constants';
import { AttributeMapping } from './attribute-mapping';

export type ItemTask = ItemActivityTask | ItemSubflow;
export type Item = ItemTask | ItemBranch;

export interface BaseItem {
  id: string;
  type: FLOGO_TASK_TYPE;
  // todo: remove
  __props?: {
    [key: string]: any;
    errors?: { msg: string; }[];
    warnings?: { msg: string; }[];
  }; // internal only properties in design time
  // todo: remove
  __status?: {
    [key: string]: boolean;
  }; // internal only properties in design time
}

export interface BaseItemSettings {
  iterate?: string;
}

export interface BaseItemTask extends BaseItem {
  ref: string;
  name: string;
  description?: string;
  inputMappings?: AttributeMapping[];
  input: {
    [name: string]: any;
  };
  settings?: BaseItemSettings;
}

export interface ItemActivityTask extends BaseItemTask {
  type: FLOGO_TASK_TYPE.TASK;
  return?: boolean;
}

export interface ItemSubflow extends BaseItemTask {
  type: FLOGO_TASK_TYPE.TASK_SUB_PROC;
  outputMappings?: AttributeMapping[];
  settings?: BaseItemSettings & {
    iterate?: string;
    flowPath?: string;
  };
}

export interface ItemBranch extends BaseItem {
  id: string;
  type: FLOGO_TASK_TYPE.TASK_BRANCH;
  condition?: string;
}
