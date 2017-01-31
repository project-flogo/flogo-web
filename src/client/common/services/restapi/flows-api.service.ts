import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, URLSearchParams, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';


@Injectable()
export class RESTAPIFlowsService{
  constructor(private http:Http ){
  }

  createFlow(flowObj: any) {
    let headers = new Headers({'Content-Type': 'application/json'});
    let options = new RequestOptions({headers: headers});
    let body = JSON.stringify(flowObj);

    return this.http.post('/v1/api/flows', body, options).toPromise();
  }

  getFlows() {
    return this.http.get('/v1/api/flows').toPromise()
      .then(response=> {
        if (response.text()) {
          return response.json();
        } else {
          return response;
        }
      });
  }

  updateFlow(flowObj: Object){
    let headers = new Headers({'Content-Type': 'application/json'});
    let options = new RequestOptions({headers: headers});
    let body = JSON.stringify(flowObj);

    return this.http.post('/v1/api/flows/update', body, options).toPromise();
  }

  deleteFlow(flowId) {
    return this.http.delete('/v1/api/flows/' + flowId).toPromise();
  }

  getFlow( id : string ) {
    return this.http.get('/v1/api/flows/' + id).toPromise()
      .then(response=>{
        if(response.text()) {
            return response.json().data;
        }
        else
          return response;
      });
  }


  findFlowsByName(flowName: string, options: { appId?: string } = {}) {
    let headers = new Headers({ Accept: 'application/json' });

    let searchParams = new URLSearchParams();
    searchParams.set('name', flowName);
    if (options.appId) {
      searchParams.set('appId', options.appId);
    }

    let requestOptions = new RequestOptions({ headers, search: searchParams });

    return this.http.get(`/v1/api/flows`, requestOptions)
      .map((res: Response) => res.json())
      .toPromise();
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

    return this.http.post('/v1/api/flows/run/flows', body, options )
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
        "flowId" : id,
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


    return this.http.post( '/v1/api/flows/run/flow/start', body, options )
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

  importFlow( file : File, appId : string, flowName?:string ) {
    let formData: FormData = new FormData();
    formData.append('importFile', file, file.name);

    let searchParams = new URLSearchParams();
    if(flowName) { searchParams.set('name', flowName); }
    if(appId)    { searchParams.set('appId', flowName); }

    let headers = new Headers({ Accept: 'application/json' });
    let requestOptions = new RequestOptions({ headers, search: searchParams });

    return this.http.post('/v1/api/flows/upload', formData, requestOptions).toPromise()
      .catch(error => Promise.reject(error.json())  );
  }

  // restartFlow() TODO need to inject instance related APIs
}
