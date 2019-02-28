import { sortBy } from 'lodash';
import { Trigger, Resource } from '@flogo-web/core';
import { ResourcePluginManifest, Dictionary } from '@flogo-web/client-core';

import { ResourceWithPlugin } from './resource-with-plugin';
import { TriggerGroup } from './trigger-group.interface';
import { FlowGroup } from './flow-group.interface';

export const resourceAndPluginMerger = (plugins: ResourcePluginManifest[]) => {
  const pluginsInfo: Dictionary<ResourcePluginManifest> = plugins.reduce(
    (resources, resource) => {
      resources[resource.type] = resource;
      return resources;
    },
    {}
  );
  return (resource: Resource): ResourceWithPlugin => {
    return { ...resource, pluginInfo: pluginsInfo[resource.type] };
  };
};

export function sortableName<T extends { name: string }>(o: T) {
  return o && o.name ? o.name.toLocaleLowerCase() : '';
}

export function groupByTrigger(
  triggers: Trigger[],
  resources: ResourceWithPlugin[]
): FlowGroup[] {
  let handlers = [];
  triggers.forEach(t => {
    handlers = handlers.concat(t.handlers);
  });
  const orphanActions = resources.filter(a => !handlers.find(h => h.resourceId === a.id));
  const orphanActionMap = new Map(<[string, any][]>orphanActions.map(a => [a.id, a]));
  const actionMap = new Map(<[string, any][]>resources.map(a => [a.id, a]));

  const pullAction = resourceId => {
    const action = actionMap.get(resourceId);
    return action;
  };

  const sortResources = resourceCollection => sortBy(resourceCollection, sortableName);

  const triggerGroups = triggers
    .map(trigger => {
      const groupResources = trigger.handlers
        .map(h => pullAction(h.resourceId))
        .filter(flow => !!flow);
      return {
        trigger: trigger,
        flows: sortResources(groupResources),
      };
    })
    .filter(triggerGroup => triggerGroup.flows.length > 0);

  // orphan flows
  if (orphanActionMap.size) {
    triggerGroups.unshift({
      trigger: null,
      flows: sortResources(Array.from(orphanActionMap.values())),
    });
  }

  return triggerGroups;
}

export function groupByResource(
  triggers: Trigger[],
  resources: ResourceWithPlugin[]
): TriggerGroup[] {
  return resources
    .map(resource => {
      return {
        flow: resource,
        triggers: triggers.filter(
          t => !!t.handlers.find(h => h.resourceId === resource.id)
        ),
      };
    })
    .map(resourceGroup => {
      resourceGroup.triggers =
        resourceGroup.triggers.length > 0 ? resourceGroup.triggers : null;
      return resourceGroup;
    });
}
