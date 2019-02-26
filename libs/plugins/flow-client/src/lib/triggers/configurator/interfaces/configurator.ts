import { FlogoAppModel } from '@flogo-web/core';
import { TriggerSchema, FlowMetadata, TriggerHandler } from '@flogo-web/client-core';

import { InstalledFunctionSchema, Trigger, TriggerConfigureState } from '../../../core';
import { Tabs } from '../../../shared/tabs/models/tabs.model';

export interface TriggerConfiguration {
  handler: any;
  trigger: any;
  isValid: boolean;
  isDirty: boolean;
  changedMappings?: HandlerMappings;
  tabs: Tabs;
}

export interface HandlerMappings {
  actionMappings: { input: any[]; output: any[] };
}

export interface TriggerDetail {
  handler: TriggerHandler;
  trigger: Trigger;
}

export interface ConfiguratorStatus {
  disableSave?: boolean;
  isOpen?: boolean;
  triggers?: TriggerStatus[];
  selectedTriggerId?: string;
}

export interface ModalStatus extends TriggerConfigureState {
  flowMetadata: FlowMetadata;
}

export interface SaveData {
  trigger: Trigger;
  mappings: HandlerMappings;
}

export interface TriggerStatus {
  id?: string;
  isValid?: boolean;
  isDirty?: boolean;
  name?: string;
}

export interface CurrentTriggerState {
  appId: string;
  flowMetadata: FlowMetadata;
  schema: TriggerSchema;
  handler: TriggerHandler;
  trigger: Trigger;
  // todo: define
  fields: any;
  appProperties?: FlogoAppModel.AppProperty[];
  functions: InstalledFunctionSchema[];
}
