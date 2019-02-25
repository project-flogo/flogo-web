import { cloneDeep } from 'lodash';
import { App, ContributionSchema, Resource, FlogoAppModel } from '@flogo-web/core';
import { ResourceExportContext } from '@flogo-web/server/core';

import { isValidApplicationType } from '../../../common/utils';
import { AppFormatter } from './app-formatter';
import { Exporter } from './exporter';
import { UniqueIdAgent } from './utils/unique-id-agent';
import { ResourceExporterFn } from './resource-exporter-fn';

export interface ExportAppOptions {
  isFullExportMode?: boolean;
  selectResources?: string[];
}

export function exportApp(
  app: App,
  resolveExporterFn: (resourceType: string) => ResourceExporterFn,
  activitySchemas: Map<string, ContributionSchema>,
  options: ExportAppOptions = {}
) {
  if (!isValidApplicationType(app.type)) {
    throw new Error('Can only export microservice applications');
  }
  const formatter = new AppFormatter(
    activitySchemas,
    createExportResolver(resolveExporterFn)
  );
  const { isFullExportMode = true, selectResources = [] } = options;
  const exporter = new Exporter(isFullExportMode, formatter, new UniqueIdAgent());
  return exporter.export(cloneDeep(app), selectResources);
}

function createExportResolver(
  resolveResourceExporter: (resourceType: string) => ResourceExporterFn
) {
  return (resource: Resource, context: ResourceExportContext): FlogoAppModel.Resource => {
    const forType = resource.type;
    const resourceExporter = resolveResourceExporter(forType);
    if (!resourceExporter) {
      // todo: error type
      throw new Error(
        `Cannot process resource of type "${forType}", no plugin registered for such type.`
      );
    }
    return resourceExporter(resource, context);
  };
}
