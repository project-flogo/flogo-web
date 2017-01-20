import {Injectable} from '@angular/core';
import { activitySchemaToTrigger } from '../../utils';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class  RESTAPITriggersService {
  constructor( private _http : Http ) {
  }

  getTriggers() {
    return this._http.get('/v1/api/triggers').toPromise()
      .then(response=> {
        if (response.text()) {
          let data = response.json().data || [];
          return _.map(data, trigger => {
            return _.assign(activitySchemaToTrigger(trigger), {
              // TODO fix this installed status.
              // as of now, whatever can be read from db, should have been installed.
              installed : true
            })
          });
        } else {
          return response;
        }
      });
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

    return this._http.post( `/v1/api/triggers`, body, options )
      .toPromise()
      .then( rsp => {
        if ( rsp.text() ) {
          return rsp.json();
        } else {
          return rsp;
        }
      } );
  }

}
