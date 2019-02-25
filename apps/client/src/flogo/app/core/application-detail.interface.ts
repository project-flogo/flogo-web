import { App } from '@flogo-web/core';
import { ApplicationDetailState } from './application-detail-state.interface';

export interface ApplicationDetail {
  app: App;
  state: ApplicationDetailState;
}
