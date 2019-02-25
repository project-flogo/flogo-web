import { App } from '@flogo-web/core';
import { FlowGraph } from '../graph';
import { Dictionary, ContribSchema } from '../common';
import { FlowMetadata } from './flow-metadata';
import { Item } from './items';

export interface UiFlow {
  id?: string;
  name?: string;
  description?: string;
  appId?: string;
  app: App;
  metadata?: FlowMetadata;
  attributes?: any[];
  mainItems: Dictionary<Item>;
  errorItems: Dictionary<Item>;
  mainGraph: FlowGraph;
  errorGraph: FlowGraph;
  schemas: Dictionary<ContribSchema>;
}
