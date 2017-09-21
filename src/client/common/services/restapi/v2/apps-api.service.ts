import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import { HttpUtilsService } from '../http-utils.service';
import { IFlogoApplicationModel } from '../../../application.model';
import { ErrorService } from '../../../../common/services/error.service';
import { Observable } from 'rxjs';
import {FLOGO_PROFILE_TYPE} from "../../../constants";

const UNTITLED_APP = 'Untitled App';

@Injectable()
export class AppsApiService {

  constructor(private http: Http, private httpUtils: HttpUtilsService, private errorService: ErrorService ) {


  }

  recentFlows() {
    return this.http.get(this.apiPrefix('actions/recent'), this.httpUtils.defaultOptions()).toPromise()
      .then(response => response.json().data);
  }

  createNewApp(profileDetails): Promise<any> {
    return this.determineUniqueName(UNTITLED_APP).then(appName => {
      let application: any = {
        type: "flogo:app",
        name: appName,
        version: '',
        description: ''
      };
      if (profileDetails.profileType === FLOGO_PROFILE_TYPE.DEVICE) {
        application.type = "flogo:device";
        application.device = {};
        application.device.profile = profileDetails.profile;
        application.device.deviceType = profileDetails.deviceType;
        application.device.settings = profileDetails.settings || {};
      }

      let options = this.httpUtils.defaultOptions();

      return this.http.post(this.apiPrefix('apps/'), application, options).toPromise()
        .then(response => response.json().data);
    });
  }

  listApps(): Promise<IFlogoApplicationModel[]> {
    return this.http.get(this.apiPrefix('apps'), this.httpUtils.defaultOptions())
      .map(response => response.json())
      .map(responseBody => responseBody.data ? responseBody.data : [])
      .toPromise();
  }

  getApp(appId: string): Promise<IFlogoApplicationModel|null> {
    return this.http.get(this.apiPrefix(`apps/${appId}`))
      .map(response => response.json())
      .map(responseBody => responseBody.data ? <IFlogoApplicationModel> responseBody.data : null)
      .toPromise();
  }

  updateApp(appId: string, app: any) {
    let options = this.httpUtils.defaultOptions();

    return this.http.patch(this.apiPrefix(`apps/${appId}`), app, options)
      .toPromise()
      .then(response => response.json())
      .then(body => body.data)
      .catch(error => Promise.reject(this.extractErrors(error)));
  }

  deleteApp(appId: string) {
    let options = this.httpUtils.defaultOptions();

    return this.http.delete(this.apiPrefix(`apps/${appId}`), options)
      .toPromise()
      .then(response => true)
      .catch(error => Promise.reject(this.extractErrors(error)));
  }

  exportApp(appId: string) {
    let options = this.httpUtils.defaultOptions();

    return this.http.get(this.apiPrefix(`apps/${appId}:export`), options)
      .map(response => response.json())
      .toPromise();
  }
  exportFlows(appId: string, flowIds: any[]) {
    let reqOptions = this.httpUtils.defaultOptions();
    if (flowIds !== []) {
      const selectedFlowIds = flowIds.toString();
      const searchParams = new URLSearchParams();
      searchParams.set('flowids', selectedFlowIds);
       reqOptions = reqOptions.merge({
          search: searchParams
        });
    }
    return this.http.get(
      this.httpUtils.apiPrefix(`apps/${appId}:export?type=flows`), reqOptions)
     .map((res: Response) => res.json())
      .toPromise();
  }
  uploadApplication(application) {
    let options = this.httpUtils.defaultOptions();

    return this.http.post(this.apiPrefix('apps:import'), application, options).toPromise()
      .then(response => response.json())
      .catch(error => Promise.reject(this.extractErrors(error)));
  }

  downloadAppLink(appId: string) {
    return this.apiPrefix(`apps/${appId}/build`);
  }

  private apiPrefix(path) {
    return this.httpUtils.apiPrefix(path, 'v2');
  }

  private extractErrors (error: Response | any) {
    if (error instanceof Response) {
      const body = error.json();
      const errs = body.errors || [body];
      return errs;
    } else {
      return new Error('Unknown error');
    }
  }

  determineUniqueName(name: string) {
    return this.listApps().then((apps: Array<IFlogoApplicationModel>) => {
      let normalizedName = name.trim().toLowerCase();
      let possibleMatches = apps
        .map(app => app.name.trim().toLowerCase())
        .filter(appName => appName.startsWith(normalizedName));

      if (!possibleMatches.length) {
        return name;
      }

      let found = true;
      let index = 0;
      while (found) {
        index++;
        found = possibleMatches.includes(`${normalizedName} (${index})`);
      }
      return `${name} (${index})`;

    });

  }

}
