import { remove } from 'lodash';
import { Injectable } from '@angular/core';

import { App } from '@flogo-web/core';
import { HttpUtilsService } from '../http-utils.service';
import { AppsApiService } from './apps-api.service';

const UNTITLED_APP = 'Untitled App';

@Injectable()
export class AppsApiServiceMock extends AppsApiService {
  private mockApplications: Array<App> = [
    {
      id: '1',
      name: 'Sample Application 1',
      version: '0.0.1',
      type: 'flogo:app',
      description: null /* should be null for test */,
      createdAt: new Date().toISOString(),
      updatedAt: null /* should be null for test */,
      /* tslint:disable:max-line-length */
      resources: [
        {
          id: '897',
          name: 'Manually adjust temperature',
          description:
            'A flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Luptas oilsksd as asdfwo',
          createdAt: new Date().toISOString(),
          type: 'flow',
          data: null,
        },
        {
          id: '987',
          name: 'Raise temperature & notifiy operator',
          description:
            'A basic flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
          createdAt: new Date().toISOString(),
          type: 'flow',
          data: null,
        },
        {
          id: '879',
          name: 'Log temperature',
          description:
            'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
          createdAt: new Date().toISOString(),
          type: 'flow',
          data: null,
        },
      ],
    },
    {
      id: '2',
      name: 'Sample Application 2',
      version: '0.0.1',
      description: 'My App',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'flogo:app',
    },
  ];
  /* tslint:enable:max-line-length */

  constructor(httpUtil: HttpUtilsService) {
    super(httpUtil, null, null, null);
  }

  listApps() {
    return Promise.resolve(<App[]>this.mockApplications);
  }

  createNewApp() {
    const application: any = {
      id: this.mockApplications.length + 1,
      name: this.determineUniqueName(UNTITLED_APP),
      version: '',
      description: '',
      createdAt: new Date(),
      updatedAt: null,
    };
    this.mockApplications.unshift(application);

    return new Promise((resolve, reject) => {
      resolve(application);
    });
  }

  deleteApp(id: string): Promise<boolean> {
    remove(this.mockApplications, (n: App) => {
      return n.id === id;
    });
    return Promise.resolve(true);
  }

  getApp(id: string): Promise<App> {
    const application = this.mockApplications.find(item => {
      return item.id === id;
    });
    return Promise.resolve(application);
  }

  determineUniqueName(name: string, count = 0) {
    const appName: string = name + (count > 0 ? ` (${count})` : '');
    let found: App;

    found = this.mockApplications.find((app: App) => {
      return app.name === appName;
    });

    if (found) {
      return this.determineUniqueName(name, ++count);
    } else {
      return appName;
    }
  }
}
