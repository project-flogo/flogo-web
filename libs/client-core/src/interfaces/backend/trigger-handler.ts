import { Dictionary } from '../common';

export interface TriggerHandler {
  resourceId: string;
  triggerId?: string;
  settings: { [name: string]: any };
  outputs: { [name: string]: any };
  actionMappings?: {
    input: Dictionary<any>;
    output: Dictionary<any>;
  };
}
