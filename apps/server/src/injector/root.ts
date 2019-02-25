import 'reflect-metadata';
import { Container } from 'inversify';
import { ResourceRegistrarFn } from '@flogo-web/server/core';

import { TOKENS } from '../core';
import { logger } from '../common/logging';
import { ResourceRepository } from '../modules/resources/resource.repository';

import { bindAndCreatePluginRegistrar } from './plugin-injection';
import { PersistenceModule } from './persistence/module';
import { ModelsModule } from './models/module';

export function createRootContainer(): {
  rootContainer: Container;
  registerResourcePlugin: ResourceRegistrarFn;
} {
  const rootContainer = new Container();
  rootContainer.bind(TOKENS.Logger).toConstantValue(logger);
  rootContainer.bind(ResourceRepository).toSelf();
  rootContainer.load(PersistenceModule, ModelsModule);
  const registerResourcePlugin = bindAndCreatePluginRegistrar(rootContainer);
  return {
    rootContainer,
    registerResourcePlugin,
  };
}
