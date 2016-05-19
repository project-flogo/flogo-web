import { Component } from '@angular/core';
import { PostService } from '../../../common/services/post.service';
import { RESTAPIService } from "../../../common/services/rest-api.service";
import { SUB_EVENTS, PUB_EVENTS } from '../messages';
import { RouteParams } from '@angular/router-deprecated';

import {InstallComponent} from '../../flogo.flows.detail.tasks.install/components/install.component';
import { RESTAPIActivitiesService } from '../../../common/services/restapi/activities-api.service';

@Component(
  {
    selector : 'flogo-flows-detail-tasks',
    moduleId : module.id,
    directives: [InstallComponent],
    templateUrl : 'tasks.tpl.html',
    styleUrls : [ 'tasks.component.css' ]
  }
)

export class FlogoFlowsDetailTasks {
  public filteredTasks : any[] = [];
  private _filterQuery : string = null;

  private tasks : any[] = [];

  private _subscriptions : any;
  private _addTaskMsg : any;

  constructor( private _postService : PostService, private _routeParams : RouteParams, private _restApiService : RESTAPIService, private _restAPIActivitiesService: RESTAPIActivitiesService) {
    console.group( 'Constructing FlogoFlowsDetailTasks' );

    console.log( this._routeParams );

    this.initSubscribe();
    this._loadActivities();

    console.groupEnd();
  }

  ngOnDestroy() {
    this._subscriptions.forEach(
      ( sub : any ) => {
        this._postService.unsubscribe( sub );
      }
    );
  }

  public get filterQuery() {
    return this._filterQuery;
  }

  public set filterQuery(query:string){
    this._filterQuery = query;
    this._filterActivities();
  }

  public sendAddTaskMsg( task : any ) {

    this._postService.publish(
      _.assign(
        {}, PUB_EVENTS.addTask, {
          // TODO for the moment, the taskId can only be number, so timestamp is used.
          data : _.assign(
            {}, this._addTaskMsg, {
              task : _.assign( {}, task )
            }
          )
        }
      )
    );
  }

  private initSubscribe() {
    this._subscriptions = [];

    let subs = [
      _.assign( {}, SUB_EVENTS.addTask, { callback : this._getAddTaskMsg.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.installActivity, { callback : this._loadActivities.bind( this ) } ),
    ];

    _.each(
      subs, sub => {
        this._subscriptions.push( this._postService.subscribe( sub ) );
      }
    );
  }

  private _loadActivities() {
    console.log('Loading activities');

    this._restAPIActivitiesService.getActivities()
      .then(
        ( tasks : any )=> {
          this.tasks = tasks;
          this._filterActivities();
        }
      )
      .catch(
        ( err : any )=> {
          console.error( err );
        }
      );
  }


  private _getAddTaskMsg( data : any, envelope : any ) {
    console.group( 'Add task message in tasks' );

    console.log( data );
    console.log( envelope );

    this._addTaskMsg = data;

    console.groupEnd();
  }

  private _filterActivities() {
    if (this.filterQuery) {
      let filterQuery = this.filterQuery.toLowerCase();
      this.filteredTasks = _.filter(this.tasks, task => task.name.toLowerCase().indexOf(filterQuery) >= 0);
    } else {
      this.filteredTasks = this.tasks;
    }
  }

}
