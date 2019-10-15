import { FlowMetadata } from '../core/interfaces/flow';

export interface SubflowConfig {
  name: string;
  description: string;
  createdAt: string;
  flowPath: string;
  metadata?: FlowMetadata;
}
