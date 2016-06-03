import { Injectable } from '@angular/core';
import { MOCK_TASKS } from '../mocks';
import { Http, Headers, RequestOptions } from '@angular/http';
import { getEngineURL, getStateServerURL } from '../utils';

@Injectable()
export class RESTAPIService {

  flows:any;
  instances:any;
  activities:any;
  triggers:any;
  engine:any;

  // TODO
  //    need to replace this mock with real implementation
  constructor(private http:Http) {

    // TODO
    //    this is only POC implementation with mock data
    this.flows = {
      restartWithIcptFrom: (id : string, data : any, step : number, curFlowID? : string, newFlowID? : string) => {
        // TODO

        // get the state of the last step
        let snapshotID = step - 1;
        if (snapshotID < 1) {
          return Promise.reject(`Invalid step ${step} to start from.`);
        }

        return this.instances.getSnapshot(id, snapshotID)
          .then(
            (state:any) => {

              // then restart from that state with data

              if ( newFlowID && curFlowID ) {
                // replace the old flowURL with the newFlowID
                let pattern = new RegExp( `flows/${curFlowID}` );
                state[ 'flowUri' ] = state[ 'flowUri' ].replace( pattern, `flows/${newFlowID}` );
              }


              let headers = new Headers(
                {
                  'Accept' : 'application/json'
                }
              );

              let options = new RequestOptions( { headers : headers } );

              return this.http.get( state[ 'flowUri' ], options )
                .toPromise()
                .then( ( rsp : any ) => {
                  if ( rsp.text() ) {
                    return rsp.json();
                  } else {
                    return rsp;
                  }
                } )
                .then( ( flowInfo : any )=> {

                  // process state info based on flowInfo
                  let icptTaskIds = _.map( data.tasks, ( task : any )=> {
                    return task.id
                  } );

                  let workQueue = _.get( state, 'workQueue', [] );
                  let taskDatas = _.get( state, 'rootTaskEnv.taskDatas', [] );
                  let linksInfo = _.get( flowInfo, 'rootTask.links', [] );

                  let taskInPath = icptTaskIds.slice();
                  let linksToGo = linksInfo.slice();
                  let lastLinksToGoLength = linksToGo.length;

                  // find all of the tasks that in the path of the given tasks to intercept.
                  // once the linksToGo stay the same or empty, then finish
                  while ( linksToGo.length ) {

                    linksToGo = _.filter( linksToGo, ( link : any ) => {
                      if ( taskInPath.indexOf( link.from ) !== -1 ) {

                        // avoid duplications
                        if ( taskInPath.indexOf( link.to ) === -1 ) {
                          taskInPath.push( link.to );
                        }

                        return false;
                      }

                      return true;
                    } );


                    if ( lastLinksToGoLength === linksToGo.length ) {
                      break;
                    }

                    lastLinksToGoLength = linksToGo.length;
                  }

                  // filter the tasks that not in the path
                  workQueue = _.filter( workQueue, ( queueItem : any ) => {
                    return taskInPath.indexOf( queueItem.taskID ) !== -1;
                  } );

                  // filter the tasks that not in the path
                  taskDatas = _.filter( taskDatas, ( taskData : any ) => {
                    return taskData.taskId === 1 || taskInPath.indexOf( taskData.taskId ) !== -1;
                  } );

                  _.set( state, 'workQueue', workQueue );
                  _.set( state, 'rootTaskEnv.taskDatas', taskDatas );

                  // restarting...
                  let body = JSON.stringify(
                    {
                      'initialState' : state,
                      'interceptor' : data
                    }
                  );

                  let headers = new Headers(
                    {
                      'Content-Type' : 'application/json',
                      'Accept' : 'application/json'
                    }
                  );

                  let options = new RequestOptions( { headers : headers } );

                  return this.http.post( `${getEngineURL()}/flow/restart`, body, options )
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
                } );
            }
          );
      }
    };

    this.instances = {
      getInstance : ( id : string ) => {
        let headers = new Headers(
          {
            'Accept' : 'application/json'
          }
        );

        let options = new RequestOptions( { headers : headers } );

        return this.http.get( `${getStateServerURL()}/instances/${id}`, options )
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
      },
      getStepsByInstanceID: (id:string) => {
        let headers = new Headers(
          {
            'Accept': 'application/json'
          }
        );

        let options = new RequestOptions({headers: headers});

        return this.http.get(`${getStateServerURL()}/instances/${id}/steps`, options)
          .toPromise()
          .then(
            rsp => {
              if (rsp.text()) {
                return rsp.json();
              } else {
                return rsp;
              }
            }
          );
      },
      getStatusByInstanceID: (id:string) => {
        let headers = new Headers(
          {
            'Accept': 'application/json'
          }
        );

        let options = new RequestOptions({headers: headers});

        return this.http.get(`${getStateServerURL()}/instances/${id}/status`, options)
          .toPromise()
          .then(
            rsp => {
              if (rsp.text()) {
                return rsp.json();
              } else {
                return rsp;
              }
            }
          );
      },
      getSnapshot: (instanceID:string, snapshotID:number) => {
        // TODO

        let headers = new Headers(
          {
            'Accept': 'application/json'
          }
        );

        let options = new RequestOptions({headers: headers});

        return this.http.get(`${getStateServerURL()}/instances/${instanceID}/snapshot/${snapshotID}`, options)
          .toPromise()
          .then(
            rsp => {
              if (rsp.text()) {
                return rsp.json();
              } else {
                return rsp;
              }
            }
          );
      },
      whenInstanceFinishByID: (id:string) => {
        return new Promise(
          (resolve, reject) => {
            let TIMEOUT = 1000;
            let _recur = () => {
              setTimeout(
                function () {
                  this.instances.getStatusByInstanceID(id)
                    .then(
                      (rsp:any) => {
                        if (rsp.status === "500") {
                          resolve(rsp);
                        } else {
                          _recur();
                        }
                      }
                    )
                    .catch(reject);
                }.bind(this), TIMEOUT
              );
            };

            _recur();
          }
        );
      }
    };

    this._initActivities();

    this.engine = {
      restart:()=>{
      }
    }

  }


  _initActivities() {

    let activities = MOCK_TASKS.map((activity:any, index:number) => Object.assign({isInstalled: index < 2, version: '0.0.1'}, activity));
    let getCopy = (arr:any[]) => arr.map((activity:any) => Object.assign({}, activity));

    let self = this;
    this.activities = {

      getAll() {
        return Promise.resolve(getCopy(activities));
      },

      getInstalled() {
        let installed = activities.filter((activity:any) => activity.isInstalled);
        return Promise.resolve(getCopy(installed));
      },

      getAvailableToInstall() {
        let available = activities.filter((activity:any) => !activity.isInstalled);
        return Promise.resolve(getCopy(available));
      },

      install(activitiesToInstall:{name:string, version:string}[]) {

        let installMap = activitiesToInstall.reduce((map:any, a:any) => {
          map[a.name] = a.version || '0.0.1';
          return map;
        }, {});

        activities
          .filter((activity:any) => {
            return installMap[activity.name] && installMap[activity.name] == activity.version;
          })
          .forEach((activity:any) => activity.isInstalled = true);

        return self.activities.getInstalled();

      },

      uninstall() {
        console.warn('Not implemented yet');
      }

    };

    this.activities.get = () => {

      if (!status) {
        return this.activities.getAll();
      } else if (status == 'installed') {
        return this.activities.getInstalled();
      } else if (status == 'none') {
        return this.activities.getAvailableToInstall();
      }

      throw new Error(`Unknown option "${status}"`);

    }

  }


}
