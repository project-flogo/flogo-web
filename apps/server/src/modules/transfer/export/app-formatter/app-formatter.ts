import { isEmpty, pick } from 'lodash';
import { ResourceExportContext } from '@flogo-web/server/core';
import { App, FlogoAppModel, ContributionSchema } from '@flogo-web/core';

import { ResourceExporterFn } from '../resource-exporter-fn';
import { formatHandler } from './format-handler';

const APP_MODEL_VERSION = '1.0.0';
const TRIGGER_KEYS: Array<keyof FlogoAppModel.Trigger> = [
  'id',
  'ref',
  'name',
  'description',
  'settings',
  'handlers',
];

export class AppFormatter {
  constructor(
    private activitySchemas: Map<string, ContributionSchema>,
    private exportResource: ResourceExporterFn
  ) {}

  format(app: App, resourceIdReconciler: Map<string, string>): FlogoAppModel.App {
    const exportContext: ResourceExportContext = {
      contributions: this.activitySchemas,
      resourceIdReconciler,
    };
    const resources = app.resources.map(resource =>
      this.exportResource(resource, exportContext)
    );
    const formattedTriggers = this.formatTriggers(app.triggers);

    return {
      name: app.name,
      type: 'flogo:app',
      version: app.version,
      appModel: APP_MODEL_VERSION,
      description: app.description,
      properties: !isEmpty(app.properties) ? app.properties : undefined,
      triggers: !isEmpty(formattedTriggers) ? formattedTriggers : undefined,
      resources: !isEmpty(resources) ? resources : undefined,
    };
  }

  formatTriggers(triggers) {
    return triggers
      .filter(trigger => !isEmpty(trigger.handlers))
      .map(trigger => {
        return pick(
          {
            ...trigger,
            handlers: trigger.handlers.map(formatHandler),
          },
          TRIGGER_KEYS
        );
      });
  }
}
