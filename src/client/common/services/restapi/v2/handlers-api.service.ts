import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { HttpUtilsService } from '../http-utils.service';

@Injectable()
export class RESTAPIHandlersService {
  constructor(private http: Http, private httpUtils: HttpUtilsService) {
  }

  updateHandler(triggerId, actionId, handlerSettings) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const options = new RequestOptions({ headers: headers });

    return this.http.put(this.apiPrefix(`triggers/${triggerId}/handlers/${actionId}`), handlerSettings, options).toPromise()
      .then(response => response.json().data);

  }

  getHandler(triggerId, actionId) {
    return this.http.get(this.apiPrefix(`triggers/${triggerId}/handlers/${actionId}`)).toPromise()
      .then(response => response.json().data);

  }

  deleteHandler(actionId, triggerId) {
    return this.http.delete(this.apiPrefix(`triggers/${triggerId}/handlers/${actionId}`)).toPromise();
  }

  private apiPrefix(path) {
    return this.httpUtils.apiPrefix(path, 'v2');
  }

}
