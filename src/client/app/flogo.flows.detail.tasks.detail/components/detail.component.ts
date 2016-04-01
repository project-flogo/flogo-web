import { Component } from 'angular2/core';
import { PostService } from '../../../common/services/post.service';
import { SUB_EVENTS, PUB_EVENTS } from '../messages';
import { RouteParams } from 'angular2/router';
import { FlogoTaskComponent } from '../../flogo.task/components/task.component';

@Component(
  {
    selector : 'flogo-flows-detail-tasks-detail',
    moduleId : module.id,
    templateUrl : 'detail.tpl.html',
    styleUrls : [ 'detail.component.css' ],
    directives : [ FlogoTaskComponent ]
  }
)

export class FlogoFlowsDetailTasksDetail {
  private _task : any;
  private _subscriptions : any;
  private _selectTaskMsg : any;

  constructor( private _postService : PostService, private _routeParams : RouteParams ) {
    console.group( 'Constructing FlogoFlowsDetailTasks' );

    console.log( this._routeParams );

    this.initSubscribe();

    console.groupEnd();
  }

  private initSubscribe() {
    this._subscriptions = [];

    let subs = [
      _.assign( {}, SUB_EVENTS.selectTask, { callback : this._getSelectTaskMsg.bind( this ) } )
    ];

    _.each(
      subs, sub => {
        this._subscriptions.push( this._postService.subscribe( sub ) );
      }
    );
  }

  ngOnDestroy() {
    this._subscriptions.forEach(
      ( sub : any ) => {
        this._postService.unsubscribe( sub );
      }
    );
  }

  private _getSelectTaskMsg( data : any, envelope : any ) {
    console.group( 'Select task message in tasks' );

    console.log( data );
    console.log( envelope );

    this._selectTaskMsg = data;
    this._task = data.task;

    // TODO
    //  this mock is to fake the modification of the task information from user
    // let keepThisInTimeout = this;
    // setTimeout(
    //   function () {
    //     console.log( 'in mock' );
    //     let modifiedTask = _.cloneDeep( data.task );
    //
    //     let petIDInput : any = _.find(
    //       modifiedTask.attributes.inputs, [
    //         'name',
    //         'petId'
    //       ]
    //     );
    //
    //     if ( petIDInput ) {
    //       petIDInput.value = petIDInput.value + '001';
    //     }
    //
    //     keepThisInTimeout.sendSelectTaskMsg( modifiedTask );
    //   }, 2000
    // );

    console.groupEnd();
  }

  sendSelectTaskMsg( task : any ) {

    // TODO
    console.log( 'sendSelectTaskMsg' );

    this._postService.publish(
      _.assign(
        {}, PUB_EVENTS.selectTask, {
          data : _.assign( {}, this._selectTaskMsg, { task : task } )
        }
      )
    );
  }
}
