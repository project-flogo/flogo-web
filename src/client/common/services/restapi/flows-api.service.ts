import { Injectable } from '@angular/core';
import { FlogoDBService } from '../db.service';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { getEngineURL, getProcessServerURL } from '../../utils';

@Injectable()
export class RESTAPIFlowsService{
  constructor(private _db: FlogoDBService, private http:Http){
  }

  createFlow(flowObj: Object){
    flowObj._id = this._db.generateFlowID();

    flowObj.$table = this._db.FLOW;

    return new Promise((resolve, reject)=>{
      this._db.create(flowObj).then((response)=>{
          resolve(response);
      }).catch((err)=>{
          reject(err);
      });
    });
  }

  getFlows(){
    return new Promise((resolve, reject)=>{
      // TODO need to change ${this._db.DEFAULT_USER_ID} to correct userID
      let options = {
        include_docs: true,
        startKey: `${this._db.FLOW}${this._db.DELIMITER}${this._db.DEFAULT_USER_ID}${this._db.DELIMITER}`,
        endKey: `${this._db.FLOW}${this._db.DELIMITER}${this._db.DEFAULT_USER_ID}${this._db.DELIMITER}\uffff`
      };
      this._db.allDocs(options).then((response)=>{
        let allFlows = [];
        let rows = response&&response.rows||[];
        rows.forEach((item)=>{
          // if this item's tabel is this._db.FLOW
          if(item&&item.doc&&item.doc.$table === this._db.FLOW){
            allFlows.push(item.doc);
          }
        });
        resolve(allFlows);
      }).catch((err)=>{
        reject(err);
      });
    });
  }

  updateFlow(flowObj: Object){
    return new Promise((resolve, reject)=>{
      this._db.update(flowObj).then((response)=>{
        resolve(response);
      }).catch((err)=>{
        reject(err);
      })
    });
  }

  deleteFlow(){
    let parameters = arguments;
    return new Promise((resolve, reject)=>{
      this._db.remove.apply(this,parameters).then((response)=>{
        resolve(response);
      }).catch((err)=>{
        reject(err);
      })
    });
  }

  getFlow( id : string ) {
    return this._db.getFlow( id );
  }

  uploadFlow( process : any ) {
    //  upload current flow to process service server

    let body = JSON.stringify( process );
    let headers = new Headers(
      {
        'Content-Type' : 'application/json',
        'Accept' : 'application/json'
      }
    );
    let options = new RequestOptions( { headers : headers } );

    return this.http.post( `${getProcessServerURL()}/flows`, body, options )
      .toPromise().then(
        ( response : Response ) => {
          if ( response.text() ) {
            return response.json()
          } else {
            // TODO
            //  need to handle the empty response
            //  maybe later on the /flows API should be changed to reply the exist process
            //  instead of an empty response, however, in that case this block won't be run
            return {};
          }
        }
      );
  }

  startFlow( id : string, data : any ) {
    let body = JSON.stringify(
      {
        "flowUri" : `${getProcessServerURL()}/flows/${id}`,
        "attrs" : data
      }
    );

    let headers = new Headers(
      {
        'Content-Type' : 'application/json',
        'Accept' : 'application/json'
      }
    );

    let options = new RequestOptions( { headers : headers } );


    return this.http.post( `${getEngineURL()}/flow/start`, body, options )
      .toPromise()
      .then(
        rsp => {
          if ( rsp.text() ) {
            return rsp.json();
          } else {
            return rsp;
          }
        }
      );
  }

  importFlow( importFile : any ) {
    return new Promise( ( resolve, reject ) => {
      var formData : any = new FormData();
      var xhr = new XMLHttpRequest();
      formData.append( 'importFile', importFile, importFile.name );

      xhr.onreadystatechange = function () {
        if ( xhr.readyState == 4 ) {
          if ( xhr.status == 200 ) {
            resolve( JSON.parse( xhr.response ) );
          } else {
            reject( {
              status : xhr.status,
              statusText : xhr.statusText,
              response : xhr.response
            } );
          }
        }
      };

      xhr.open( 'POST', '/v1/api/flows/json', true );
      xhr.send( formData );
    } );
  }

  // restartFlow() TODO need to inject instance related APIs
}
