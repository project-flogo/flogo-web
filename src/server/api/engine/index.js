import {config, engines} from '../../config/app-config';
import _ from 'lodash';

let basePath = config.app.basePath;

export function engine(app, router){
  if(!app){
    console.error("[Error][api/engine/index.js]You must pass app");
  }
  router.get(basePath+"/engine/restart", restartEngine);


}

function* restartEngine(next){
  console.log('Restart Engine');
  let data = {
    status: 200
  };

  try{
    let name = this.query&&this.query.name? this.query&&this.query.name: "test";

    let testEngine = engines.test;

    if(name == "build"){
      testEngine = engines.build;
    }

    if(testEngine.stop()){
      if(!testEngine.start()){
        data.status = 500;

        console.log("didn't start successful");
      }
    }else{
      data.status = 500;
      console.log("didn't stop successful");
    }

    this.body = data;
    yield next;
  }catch(err){
    console.log("[error][restartEngine]: ", err);
    data.status = 500;
    this.body = data;
    yield next;
  }
}
