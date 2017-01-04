import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { IFlogoApplicationModel } from '../../../common/application.model';
//import IfStatement = ts.IfStatement;

const UNTITLED_APP = 'Untitled App';

@Injectable()
export class RESTAPIApplicationsService {
    private applications : Array<IFlogoApplicationModel> = [
        {
            id: "1",
            name: "Sample Application 1",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date(),
            flows: [
                {
                    id: '897',
                    name: 'Manually adjust temperature',
                    description: 'A flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt Luptas oilsksd as asdfwo',
                    createdAt: new Date()
                },
                {
                    id: '987',
                    name: 'Raise temperature & notifiy operator',
                    description: 'A basic flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
                    createdAt: new Date()
                },
                {
                    id: '879',
                    name: 'Log temperature',
                    description: 'A complex flow for apietusam faccum esequi berum. Hentias porerum ent omniend itatempoer porem uga. Luptati optaquisist quibus rem quam unt',
                    createdAt: new Date()
                }
            ]
        },
        {
            id: "2",
            name: "Sample Application 2",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "3",
            name: "Sample Application 3",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },      {
            id: "4",
            name: "Sample Application 4",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },      {
            id: "5",
            name: "Sample Application 5",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },      {
            id: "6",
            name: "Sample Application 6",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },      {
            id: "7",
            name: "Sample Application 7",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },      {
            id: "8",
            name: "Sample Application 8",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },      {
            id: "9",
            name: "Sample Application 9",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "10",
            name: "Sample Application 10",
            version: "0.0.1",
            description: "My App",
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

  constructor(public _http : Http ) {
  }

  list() {
      return new Promise((resolve, reject)=> {
          resolve(this.applications);
      });
  }

  add()   {
      let application: any =  {
          id: this.applications.length + 1,
          name: this.getNewAppName(UNTITLED_APP),
          version: '',
          description: '',
          createdAt: new Date(),
          updatedAt: null
      };
      this.applications.unshift(application);

      return new Promise((resolve, reject)=> {
          resolve(application);
      });
  }

  delete(id:string)   {
      _.remove(this.applications, (n:IFlogoApplicationModel)=> {
          return n.id === id;
      });

      return new Promise((resolve, reject)=> {
          resolve(true);
      });
  }

  get(id:string)   {
      let application = this.applications.find((item)=> {
          return item.id == id;
      });

      return new Promise((resolve, reject)=> {
          resolve(application);
      });
  }

    getNewAppName(name:string, count = 0) {
        let appName:string = name +  (count > 0 ?   ` (${count})` : '');
        let found: IFlogoApplicationModel;

        found = this.applications.find((app: IFlogoApplicationModel)=> {
            return app.name == appName;
        });

        if(found) {
            return this.getNewAppName(name , ++count);
        } else {
            return appName;
        }
    }
}
