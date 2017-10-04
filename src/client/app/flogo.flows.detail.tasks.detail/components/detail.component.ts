import { Component } from '@angular/core';
import { PostService } from '../../../common/services/post.service';
import { SUB_EVENTS, PUB_EVENTS } from '../messages';

@Component(
  {
    selector : 'flogo-flows-detail-tasks-detail',
   // moduleId : module.id,
    templateUrl : 'detail.tpl.html',
    styleUrls : [ 'detail.component.less' ],
  }
)

export class FlogoFlowsDetailTasksDetail {
  _flowId:string;
  _task : any;
  _step : any;
  _context: any;
  private _subscriptions : any;
  _selectTaskMsg : any;

  constructor( private _postService : PostService ) {
    console.group( 'Constructing FlogoFlowsDetailTasks' );

    this.initSubscribe();

    console.groupEnd();
  }

  private initSubscribe() {
    this._subscriptions = [];

    let subs = [
      _.assign( {}, SUB_EVENTS.selectTask, { callback : this._getSelectTaskMsg.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.updateTriggerTask, { callback : this._updateTriggerContext.bind( this ) } )
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

  onAction(event) {
    // Applicable only for Triggers but not for tasks
  }

  private _getSelectTaskMsg( data : any, envelope : any ) {
    // TODO is need it?
    this._flowId = data.id;
    console.group( 'Select task message in tasks' );

    console.log( data );
    console.log( envelope );

    this._selectTaskMsg = data;
    this._task = data.task;
    this._step = data.step;
    this._context = data.context;

    if(_.isFunction( envelope.done )) {
      envelope.done();
    }

    console.groupEnd();
  }

  private _updateTriggerContext(data: any, envelope: any){
    this._task = _.assign({}, this._task, {
      name: data.updatedTrigger.name
    });
    this._context = _.assign({}, this._context, {
      app : data.updatedApp,
      currentTrigger: data.updatedTrigger
    });
  }

}
