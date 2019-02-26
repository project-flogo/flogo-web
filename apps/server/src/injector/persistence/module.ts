import { ContainerModule, interfaces } from 'inversify';
import { apps, indexer } from '../../common/db';
import { TOKENS } from '../../core';

export const PersistenceModule = new ContainerModule((bind: interfaces.Bind) => {
  bind(TOKENS.AppsDb).toConstantValue(apps);
  bind(TOKENS.ResourceIndexerDb).toConstantValue(indexer);
});
