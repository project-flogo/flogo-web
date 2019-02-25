import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

import { App } from '@flogo-web/core';
import { FileDownloaderService } from '../../file-downloader.service';
import { HttpUtilsService } from '../http-utils.service';
import { RestApiService } from '../rest-api.service';

const UNTITLED_APP = 'Untitled App';

@Injectable()
export class AppsApiService {
  constructor(
    private httpUtils: HttpUtilsService,
    private httpClient: HttpClient,
    private restApi: RestApiService,
    private downloadService: FileDownloaderService
  ) {}

  recentFlows() {
    return this.restApi.get('resources/recent').toPromise();
  }

  createNewApp(): Promise<any> {
    return this.determineUniqueName(UNTITLED_APP).then(appName => {
      const application: any = {
        type: 'flogo:app',
        name: appName,
        version: '',
        description: '',
      };
      return this.restApi.post('apps', application).toPromise();
    });
  }

  listApps(): Promise<App[]> {
    return this.restApi.get<App[]>('apps').toPromise();
  }

  getApp(appId: string): Promise<App | null> {
    return this.restApi.get<App>(`apps/${appId}`).toPromise();
  }

  updateApp(appId: string, app: any) {
    return this.restApi
      .patch<App>(`apps/${appId}`, app)
      .toPromise()
      .catch(error => Promise.reject(this.extractErrors(error)));
  }

  deleteApp(appId: string) {
    return this.restApi
      .delete(`apps/${appId}`)
      .toPromise()
      .then(() => true)
      .catch(error => Promise.reject(this.extractErrors(error)));
  }

  // todo: combine with exportflows
  exportApp(appId: string) {
    return this.restApi
      .get<any>(`apps/${appId}:export`)
      .toPromise()
      .catch(err => Promise.reject(err && err.error ? err.error : err));
  }

  // todo: combine with exportapp
  exportFlows(appId: string, flowIds: any[]) {
    let requestParams = new HttpParams({ fromObject: { type: 'flows' } });
    if (flowIds && flowIds.length > 0) {
      const selectedFlowIds = flowIds.join(',');
      requestParams = requestParams.set('flowids', selectedFlowIds);
    }
    return this.restApi
      .get(`apps/${appId}:export`, { params: requestParams })
      .toPromise()
      .catch(err => Promise.reject(err && err.error ? err.error : err));
  }

  uploadApplication(application) {
    return this.restApi
      .post<App>('apps:import', application)
      .toPromise()
      .catch(error => Promise.reject(this.extractErrors(error)));
  }

  downloadAppLink(appId: string) {
    return this.apiPrefix(`apps/${appId}/build`);
  }

  buildAndDownload(appId: string, { os, arch }) {
    const url = this.downloadAppLink(appId);
    const params = new HttpParams({ fromObject: { os, arch } });
    return this.httpClient
      .get(url, { params, responseType: 'blob', observe: 'response' })
      .pipe(this.downloadService.downloadResolver());
  }

  determineUniqueName(name: string) {
    return this.listApps().then((apps: Array<App>) => {
      const normalizedName = name.trim().toLowerCase();
      const possibleMatches = apps
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

  private apiPrefix(path) {
    return this.httpUtils.apiPrefix(path);
  }

  private extractErrors(error: HttpErrorResponse | any) {
    const body = error.error;
    if (body instanceof Error) {
      return new Error(`Unknown error: error.error.message`);
    } else {
      return body.errors || [body];
    }
  }
}
