import { Injectable } from '@angular/core';
import { activitySchemaToTask } from '../../utils';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { HttpUtilsService } from './http-utils.service';

@Injectable()
export class RESTAPIActivitiesService {
  constructor( private _http : Http,private httpUtils: HttpUtilsService ) {
  }

  getActivityDetails(activityRefUrl: string) {
    return this._http.get(this.apiPrefix('activities?filter[ref]=' + activityRefUrl)).toPromise()
      .then(response => response.json().data[0]);
  }

  getActivities() {
    return this._http.get(this.apiPrefix('activities')).toPromise();
  }

  installActivities( urls : string[] ) {

    let body = JSON.stringify( {
      'urls' : urls
    } );

    let headers = new Headers( {
      'Content-Type' : 'application/json',
      'Accept' : 'application/json'
    } );

    let options = new RequestOptions( { headers : headers } );

    return this._http.post(this.apiPrefix('activities'), body, options )
      .toPromise()
      .then( rsp => {
        if ( rsp.text() ) {
          return rsp.json();
        } else {
          return rsp;
        }
      } );
  }

  private apiPrefix(path) {
    return this.httpUtils.apiPrefix(path, 'v1');
  }
}
