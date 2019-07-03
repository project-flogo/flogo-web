import { rootContainer, createApp as createServerApp } from './init';

import { initDb } from './common/db';
import { logger } from './common/logging';
import { config } from './config/app-config';
import { init as initWebsocketApi } from './api/ws';
import { getInitializedEngine } from './modules/engine';
import { syncTasks } from './modules/contrib-install-controller/sync-tasks';

initDb()
  .then(() => initEngine(config.defaultEngine.path))
  .then(() =>
    createServerApp({
      port: config.app.port as string,
      staticPath: config.publicPath,
      logsRoot: config.localPath,
      container: rootContainer,
    })
  )
  .then(newServer => initWebSocketApi(newServer))
  .then(() => {
    console.log('flogo-web::server::ready');
    showBanner();
  })
  .catch(err => {
    logger.error(err && err.message);
    console.error(err);
    process.exit(1);
  });

function initWebSocketApi(newServer) {
  if (!process.env['FLOGO_WEB_DISABLE_WS']) {
    return initWebsocketApi(newServer);
  }
  logger.info("Won't start websocket service");
  return null;
}

async function initEngine(enginePath) {
  const engine = await getInitializedEngine(enginePath, {
    forceCreate: !!process.env['FLOGO_WEB_ENGINE_FORCE_CREATION'],
  });
  await engine.build();
  await engine.stop().then(() => engine.start());
  await syncTasks(engine);
}

function showBanner() {
  console.log(`
  ======================================================
                 ___       __   __   __ TM
                |__  |    /  \\ / _\` /  \\
                |    |___ \\__/ \\__| \\__/

   [success] open http://localhost:${config.app.port} in your browser
  ======================================================
`);
}
