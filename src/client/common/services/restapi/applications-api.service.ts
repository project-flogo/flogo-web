import { Injectable } from '@angular/core';
import {Http, Headers, RequestOptions, Response, URLSearchParams} from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { IFlogoApplicationModel } from '../../application.model';
import { ErrorService } from '../../../common/services/error.service';

const UNTITLED_APP = 'Untitled App';

@Injectable()
export class RESTAPIApplicationsService {

  constructor(private http : Http, private errorService: ErrorService ) {
  }

  recentFlows() {
    return this.http.get('/v1/api/flows/recent').toPromise()
      .then(response=> response.json().data);
  }

  getAllApps() {
    return this.http.get('/v1/api/apps').toPromise()
      .then(response => {
        if (response.text()) {
          let apps: Array<IFlogoApplicationModel> = response.json().data;
          return apps;
        } else {
          return response;
        }
      });
  }

  allFlows()   {
    return this.http.get('/v1/api/flows').toPromise()
      .then(response=> response.json());
  }

  createNewApp(): Promise<any> {
    return this.determineUniqueName(UNTITLED_APP).then(appName => {
      let application: any = {
        name: appName,
        version: '',
        description: ''
      };

      let headers = new Headers({'Content-Type': 'application/json'});
      let options = new RequestOptions({headers: headers});
      let body = JSON.stringify(application);

      return this.http.post('/v1/api/apps', body, options).toPromise()
       .then(response => response.json().data);
    })
  }

  deleteApp(appId:string)   {
    return this.http.delete('/v1/api/apps/' + appId).toPromise();
  }

  getApp(appId: string) : Promise<IFlogoApplicationModel> {
    return this.http.get('/v1/api/apps/' + appId).toPromise()
      .then(response => {
        if (response.text()) {
          let app: IFlogoApplicationModel = response.json().data;
          return app;
        } else {
          // TODO: what should we expect here?
          return response;
        }
      });
  }

  updateApp(appId:string, app:any){
    let headers = new Headers({'Content-Type': 'application/json'});
    let options = new RequestOptions({headers: headers});

    return this.http.patch(`/v1/api/apps/${appId}`, app, options).toPromise()
      .then(response => this.extractData(response))
      .catch(error => this.handleError(error));
  }

  export(appId: string) {
    let headers = new Headers({'Content-Type': 'application/json'});
    let options = new RequestOptions({headers: headers});

    return this.http.get(`/v1/api/apps/${appId}/export`, options).toPromise()
      .then(response => response.json())
      .catch(error => this.handleError(error));
  }

  determineUniqueName(name: string) {
    return this.getAllApps().then((apps:Array<IFlogoApplicationModel>) => {
      let normalizedName = name.trim().toLowerCase();
      let possibleMatches = apps
        .map(app => app.name.trim().toLowerCase())
        .filter(name => name.startsWith(normalizedName));

      if(!possibleMatches.length) {
        return name;
      }

      let found = true;
      let index = 0;
      while (found) {
        index++;
        found = possibleMatches.includes(`${normalizedName} (${index})`);
      }
      return `${name} (${index})`

    });

  }

  uploadApplication( file : File, appName : string = '') {
    let formData: FormData = new FormData();
    formData.append('importFile', file, file.name);

    let searchParams = new URLSearchParams();
    searchParams.set('appName', appName);
    let headers = new Headers({ Accept: 'application/json' });
    let requestOptions = new RequestOptions({ headers, search: searchParams });

    return this.http.post('/v1/api/apps/import', formData, requestOptions).toPromise()
              .then(response => this.extractData(response) )
              .catch(error => this.handleError(error) );
  }


  private extractData(res : Response) {
    let body = res.json();
    return body.data || { };
  }

  private handleError (error: Response | any) {
    if (error instanceof Response) {
      const body = error.json();
      const errs = this.errorService.transformErrors(body.errors || [body]);
      return Promise.reject(errs);
    } else {
      return Promise.reject(new Error('Unknown error'));
    }
  }

}
