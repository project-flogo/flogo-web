import { FlowDiagram, Dictionary, Item } from 'flogo/core/index';

export interface HandlerInfo {
  diagram: FlowDiagram;
  tasks: Dictionary<Item>;
}
