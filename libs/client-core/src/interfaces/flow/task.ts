import { FLOGO_TASK_TYPE } from '../../constants';
import { TaskAttribute, TaskAttributes } from './attribute';
import { Link } from './link';
import { Dictionary, SchemaAttribute } from '../common';

export interface Task {
  id: string;
  type: FLOGO_TASK_TYPE;
  version?: string;
  name?: string;
  activityRef?: string;
  ref?: string;
  description?: string;
  activityType?: string;
  triggerType?: string;
  attributes?: TaskAttributes;
  inputMappings?: Dictionary<any>;
  outputMappings?: Dictionary<any>;
  tasks?: Task[];
  links?: Link[];
  settings?: {
    iterate?: string;
    flowPath?: string;
  };

  activitySettings?: Dictionary<any>;
  condition?: string;
  __props?: {
    [key: string]: any;
    errors?: { msg: string }[];
    warnings?: { msg: string }[];
  }; // internal only properties in design time
  __status?: {
    [key: string]: boolean;
  }; // internal only properties in design time
}
