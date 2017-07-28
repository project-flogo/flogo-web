import {Injectable} from '@angular/core';
import { activitySchemaToTrigger } from '../../utils';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { HttpUtilsService } from './http-utils.service';

@Injectable()
export class  RESTAPITriggersService {
  constructor( private _http : Http,private httpUtils: HttpUtilsService) {
  }

  getTriggerDetails(triggerWhereUrl: string) {
    return this._http.get(this.apiPrefix('triggers?filter[ref]=' + triggerWhereUrl)).toPromise()
      .then(response => response.json().data[0]);
  }

  getTriggers() {
    return this._http.get(this.apiPrefix('triggers')).toPromise();
  }

  installTriggers( urls : string[] ) {

    let body = JSON.stringify( {
      'urls' : urls
    } );

    let headers = new Headers( {
      'Content-Type' : 'application/json',
      'Accept' : 'application/json'
    } );

    let options = new RequestOptions( { headers : headers } );

    return this._http.post(this.apiPrefix('triggers'), body, options )
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
