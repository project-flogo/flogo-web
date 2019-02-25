import { Container } from 'inversify';
import * as Router from 'koa-router';
const RouterConstructor = require('koa-router');

import { config } from '../../config/app-config';
import { errorMiddleware } from './error-middleware';
import { apps } from './apps';
import { triggers } from './triggers';
import { contribs as microserviceContribs } from './contribs/microservices';
import { handlers } from './handlers';
import { mountServices } from './services';
import { mountEngine } from './engine';
import { mountTestRunner } from './runner';
import { mountResourceRoutes } from './resources';

export function createRouter(container: Container): Router {
  const router = new RouterConstructor({
    prefix: config.app.basePathV2,
  });
  router.use(errorMiddleware);
  apps(router, container);
  triggers(router, container);
  microserviceContribs(router);
  handlers(router, container);
  mountResourceRoutes(router, container);
  mountServices(router);
  mountEngine(router);
  mountTestRunner(router);
  return router;
}
