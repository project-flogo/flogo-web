import {Component} from '@angular/core';
import {RESTAPIFlowsService} from './restapi/flows-api.service';
import {RESTAPIActivitiesService} from './restapi/activities-api.service';
import {RESTAPITriggersService} from './restapi/triggers-api.service';

@Component({
  moduleId: module.id,
  template:
            `<div id="test-container" class="container">

            </div>`,
  providers: [RESTAPIFlowsService, RESTAPIActivitiesService, RESTAPITriggersService]
})

export class RESTAPITest{
  constructor(
    private _flow:RESTAPIFlowsService
  ){
    this.testFlow();
  }

  print(title, request, response, fail){
    let className = 'panel-success';
    if(fail){
      className = 'panel-danger';
    }

    if(request){
      if(typeof request == 'object'){
        request = JSON.stringify(request, null, 2);
      }else{
        request = request.toString();
      }
    }else{
      request = '';
    }

    if(response){
      if(typeof response == 'object'){
        response = JSON.stringify(response, null, 2);
      }else{
        response = response.toString();
      }
    }else{
      response = '';
    }

    let html = `
    <div class="panel ${className}">
      <div class="panel-heading">${title}</div>
      <div class="panel-body">
        <h3>
          Request
        </h3>
        <pre>${request}</pre>
        <h3>
          Response
        </h3>
        <pre>${response}</pre>

      </div>
    </div>
    `;
    window.jQuery("#test-container").append(html);
  }

  testFlow(){
    new Promise((resolve, reject)=>{
      // step 1: create flow
      let request = {
        name: "My First Flow "+ new Date().toISOString(),
        description: "Created by rest-api.spec"
      };
      this._flow.createFlow(_.clone(request)).then((response)=>{
        console.log("create flow successful. ", response);
        this.print('create flow successful',request, response);
        resolve(response);
      }).catch((err)=>{
        console.log("create flow error. ", err);
        this.print('create flow error',request, err, true);
        reject(err);
      });
    }).then((response)=>{
      // step 2: get all flows
      return new Promise((resolve, reject)=>{
        this._flow.getFlows().then((response)=>{
          this.print('get all flows successful',null, response);
          resolve(response);
        }).catch((err)=>{
          this.print('get all flows error',null, err, true);
          reject(err);
        })
      })
    }).then((response)=>{
      // step 3: update a flow
      return new Promise((resolve, reject)=>{
        let flow = response&&response[0] || {};
        flow.name = flow.name+"change name ";
        this._flow.updateFlow(flow).then((response)=>{
          this.print('update flow successful',flow, response);
          resolve(response);
        }).catch((err)=>{
          this.print('update flow error',flow, err, true);
          reject(err);
        });
      });
    }).then((response)=>{
      // step 4: remove a flow
      return new Promise((resolve, reject)=>{
        let id = response.id;
        let rev = response.rev;
        this._flow.deleteFlow(id, rev).then((response)=>{
          this.print('remove flow successful',{id: id, rev: rev}, response);
          resolve(response);
        }).catch((err)=>{
          this.print('remove flow error',{id: id, rev: rev}, err, true);
          reject(err);
        });
      });
    })
  }
}
