import 'babel-polyfill';
var fs = require('fs');
var path = require('path');

import koa from 'koa';
import koaStatic from 'koa-static';
var router = require('koa-router')();
import bodyParser from 'koa-body';
import compress from 'koa-compress';
var cors = require('koa-cors');

import {config, flowsDBService} from './config/app-config';
import {initAllDbs} from './common/db/init-all';
import { createViews } from './common/db/create-views';
import {api} from './api';
import {init as initWebsocketApi} from './api/ws';
import {syncTasks, installSamples, installDefaults, getInitializedEngine, ensureDefaultDirs} from './modules/init';

// TODO Need to use cluster to improve the performance

let app;

/**
 * Server start logic
 *
 * 1. register default activities and triggers.
 * 2. initialise the default engine (the test engine) and build engine.
 * 3. start the test engine.
 * 4. configure the server and start listening
 */

ensureDefaultDirs()
  .then(() => getInitializedEngine(config.defaultEngine.path, {
      forceCreate: !!process.env['FLOGO_WEB_ENGINE_FORCE_CREATION']
  }))
  .then(engine => {
    return engine.build()
      .then(() => engine.stop())
      .then(() => engine.start())
      .then(() =>
        initAllDbs()
          .then(() => syncTasks(engine))
          .then(() => createViews())
      )
      .then(() => { console.log(engine.getTasks()) })
  })
  .then(() => initServer())
  .then((server) => {
    initWebsocketApi(server);
  })
  .then(() => flowsDBService
    .verifyInitialDataLoad(path.resolve('db-init/installed-flows.init'))
    .then(() => installDefaults())
    .then(() => installSamples()))
  .then(() => {
    console.log('flogo-web::server::ready');
    showBanner();
  })
  .catch((err)=> {
    console.log(err);
    throw err;
  });


function initServer() {

  return new Promise((resolve, reject)=> {

    app = koa();

    let port = config.app.port;

    app.use(cors());

    api(app, router);

    // make sure deep link it works
    app.use(function *(next) {
      var path = this.path.endsWith('/') ? this.path.substring(0, this.path.length - 1) : this.path;

      // not include restful api
      if (!/\/[^\/]+\.[^.\/]+$/i.test(path) && path.toLowerCase()
          .search('/api/') === -1) {
        this.path = '/';
      }
      yield  next;
    });

    // compress
    app.use(compress({
      filter: function (content_type) {
        return /text/i.test(content_type)
      },
      threshold: 2048,
      flush: require('zlib').Z_SYNC_FLUSH
    }));

    // server static resources
    app.use(koaStatic(config.publicPath, {maxage: config.app.cacheTime}));
    app.use(bodyParser({multipart: true}));

    app.on('error', function (err) {
      if (401 == err.status) {
        return;
      }
      if (404 == err.status) {
        return;
      }

      console.error(err);
      reject(err);
    });

    app.use(router.routes());

    // logger
    app.use(function *(next) {
      var start = new Date;
      yield next;
      var ms = new Date - start;
      console.log('%s %s - %s', this.method, this.url, ms);
      console.log(this.body);
      console.log(this.request.body);
    });

    var server = require('http').createServer(app.callback());
    server.listen(port, ()=> {
      console.log(`[log] start web server done.`);

      resolve(server);
    });
  });
}

function showBanner() {
  console.log('flogo-web::server::ready');
  console.log("=============================================================================================");
  console.log(`[success] open http://localhost:${config.app.port} or http://localhost:${config.app.port}/_config in your browser`);
  console.log("=============================================================================================");
}
