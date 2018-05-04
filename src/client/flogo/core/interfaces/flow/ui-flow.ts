import { Dictionary, ContribSchema } from '../common';
import { App } from './app';
import { NodeDictionary } from '../flow-diagram';
import { FlowMetadata } from './flow-metadata';
import { Item } from './items';

export interface Handler {
  paths: {
    root: {
      is: string
    };
    nodes: NodeDictionary,
  };
  items: Dictionary<Item>;
}

export interface UiFlow extends Handler {
  id?: string;
  name?: string;
  description?: string;
  appId?: string;
  app: App;
  metadata?: FlowMetadata;
  attributes?: any[];
  items: Dictionary<Item>;
  errorHandler?: Handler;
  schemas: Dictionary<ContribSchema>;
}
