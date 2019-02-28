import { omit, pick } from 'lodash';
import { inject, injectable } from 'inversify';
import { App } from '@flogo-web/core';
import {
  Resource,
  ResourceHooks,
  BeforeUpdateHookParams,
  FlogoError,
  ValidationError,
} from '@flogo-web/server/core';
import { HandlersService } from '../apps/handlers-service';
import { ERROR_TYPES } from '../../common/errors';
import { generateShortId } from '../../common/utils';
import { findGreatestNameIndex } from '../../common/utils/collection';
import { TOKENS, PluginResolverFn } from '../../core';
import { ResourceRepository } from './resource.repository';
import { genericFieldsValidator, ValidatorFn } from './validation';
import { cleanInputOnCreate, cleanInputOnUpdate } from './input-cleaner';

@injectable()
export class ResourceService {
  private resourceFieldsValidator: ValidatorFn;

  constructor(
    @inject(TOKENS.ResourcePluginFactory)
    private resolvePlugin: PluginResolverFn,
    private resourceRepository: ResourceRepository,
    private handlersService: HandlersService
  ) {
    this.resourceFieldsValidator = genericFieldsValidator(type =>
      this.isTypeSupported(type)
    );
  }

  isTypeSupported(type: string) {
    return !!type && this.resolvePlugin(type) !== null;
  }

  async create(appId: string, resource: Partial<Resource<unknown>>) {
    const app: App = await this.getApp(appId);

    resource = cleanInputOnCreate(resource);
    this.validateResource(resource);

    resource.id = generateShortId();
    resource.name = ensureUniqueName(app.resources, resource.name);

    resource = await this.applyCreationHook(resource);

    await this.resourceRepository.create(appId, resource as Resource);
    return this.findOne(resource.id);
  }

  async update(resourceId: string, changes: Partial<Resource>) {
    const existingResource = await this.findOne(resourceId);
    if (!existingResource) {
      throw new FlogoError(`No resource with id ${resourceId}`, {
        type: ERROR_TYPES.COMMON.NOT_FOUND,
      });
    }
    const appId = existingResource.appId;
    changes = cleanInputOnUpdate(changes);
    let updatedResource = { ...existingResource, ...changes };
    this.validateResource({ ...existingResource, ...changes });
    updatedResource = await this.applyUpdateHook({
      changes,
      existingResource,
      updatedResource,
    });
    await this.resourceRepository.update(appId, { ...changes, id: resourceId });
    return this.findOne(resourceId);
  }

  async list(
    appId: string,
    options: { filter?: { by: string; value: any }; project?: any }
  ): Promise<Resource[]> {
    const app: App = await this.getApp(appId);

    let resources = app && app.resources ? app.resources : [];
    resources = applyListFilters(resources, options);

    const hooks = this.createHookCache();
    resources = await mapAsync<Resource>(resources, resource =>
      hooks.get(resource.type).beforeList({ ...resource })
    );
    hooks.destroy();

    return resources;
  }

  async findOne(resourceId: string) {
    let app = await this.resourceRepository.findAppByResourceId(resourceId);
    if (!app) {
      return null;
    }
    let resource = app.resources.find(r => r.id === resourceId);
    const plugin = this.resolvePlugin(resource.type);
    if (plugin) {
      resource = await plugin.beforeList({ ...resource });
    }
    // todo: app normalization should be done somewhere else
    resource.appId = app._id;
    app.id = app._id;
    const triggers = app.triggers.filter(isTriggerForResource(resource.id));
    app = omit(app, ['triggers', 'resources', '_id']);
    return { ...resource, app, triggers };
  }

  async listRecent() {
    const recentIds = await this.resourceRepository.listRecent();
    const recentResources = await mapAsync(recentIds, ({ id }) => this.findOne(id));
    return recentResources.filter(Boolean);
  }

  async remove(resourceId) {
    const wasRemoved = await this.resourceRepository.remove(resourceId);
    if (wasRemoved) {
      // todo: HandlersManager should be injected
      await this.handlersService.removeByResourceId(resourceId);
    }
    return wasRemoved;
  }

  removeFromRecentByAppId(appId) {
    return this.resourceRepository.removeFromRecent('appId', appId);
  }

  private validateResource(resource: Partial<Resource<unknown>>) {
    const errors = this.resourceFieldsValidator(resource);
    if (errors) {
      throw new ValidationError('Validation error', errors);
    }
  }

  private async getApp(appId: string) {
    if (!appId) {
      throw new FlogoError('Missing app id', { type: ERROR_TYPES.COMMON.NOT_FOUND });
    }

    const app: App = await this.resourceRepository.getApp(appId);
    if (!app) {
      throw new FlogoError('App not found', { type: ERROR_TYPES.COMMON.NOT_FOUND });
    }
    return app;
  }

  private async applyCreationHook(resource: Partial<Resource<unknown>>) {
    const resourceHooks = this.resolvePlugin(resource.type);
    const processedResource = await resourceHooks.beforeCreate({
      ...resource,
    } as Resource);
    resource.data = processedResource.data;
    return resource;
  }

  private async applyUpdateHook(params: BeforeUpdateHookParams<unknown>) {
    const resourceHooks = this.resolvePlugin(params.existingResource.type);
    const resourceBeforeHook = { ...params.updatedResource };
    const processedResource = await resourceHooks.beforeUpdate(params);
    resourceBeforeHook.data = processedResource.data;
    return resourceBeforeHook;
  }

  private createHookCache() {
    const hooks = new Map<string, ResourceHooks>();
    const resolveHook = type => {
      let hook = hooks.get(type);
      if (!hook) {
        hook = this.resolvePlugin(type);
        hooks.set(type, hook);
      }
      return hook;
    };
    return {
      get: resolveHook,
      destroy: () => hooks.clear(),
    };
  }
}

function mapAsync<T>(collection = [], mapFn: (e) => Promise<T>): Promise<T[]> {
  return Promise.all(collection.map(mapFn));
}

function ensureUniqueName(resources: Resource[], name: string) {
  const greatestIndex = findGreatestNameIndex(name, resources);
  if (greatestIndex >= 0) {
    name = `${name} (${greatestIndex + 1})`;
  }
  return name;
}

function isTriggerForResource(resourceId: string) {
  // TODO: actionId is resourceId now?
  const isHandlerForResource = h => h.resourceId === resourceId;
  return t => !!t.handlers.find(isHandlerForResource);
}

function applyListFilters(resources, options) {
  if (options && options.filter && options.filter.by === 'name') {
    const comparableName = options.filter.value.trim().toLowerCase();
    resources = resources.filter(a => comparableName === a.name.trim().toLowerCase());
  } else if (options && options.filter && options.filter.by === 'id') {
    resources = resources.filter(a => options.filter.value.indexOf(a.id) !== -1);
  }
  return projectOutputOnFields(resources, options.project);
}

function projectOutputOnFields(resourceArray, fields) {
  if (fields && fields.length > 0) {
    fields.push('id', 'type');
    return resourceArray.map(resource => pick(resource, fields));
  }
  return resourceArray;
}
