import {Component, OnDestroy} from '@angular/core';
import {PostService} from '../../../common/services/post.service';
import {SUB_EVENTS, PUB_EVENTS} from '../messages';

@Component({
  selector: 'flogo-flows-detail-triggers-detail',
  // moduleId: module.id,
  templateUrl: 'detail.tpl.html',
  styleUrls: ['detail.component.less']
})

export class FlogoFlowsDetailTriggersDetailComponent implements OnDestroy {
  _flowId: string;
  _task: any;
  _step: any;
  _context: any;
  private _subscriptions: any;

  constructor(private _postService: PostService) {
    this.initSubscribe();
  }

  ngOnDestroy() {
    this._subscriptions.forEach(
      ( sub: any ) => {
        this._postService.unsubscribe( sub );
      }
    );
  }

  private initSubscribe() {
    this._subscriptions = [];

    const subs = [
      _.assign( {}, SUB_EVENTS.selectTrigger, { callback : this._getSelectTriggerMsg.bind( this ) } )
    ];

    _.each(
      subs, sub => {
        this._subscriptions.push( this._postService.subscribe( sub ) );
      }
    );
  }

  private _getSelectTriggerMsg( data: any, envelope: any ) {
    // TODO is need it?
    this._flowId = data.id;
    console.group( 'Select Trigger message in Trigger details' );

    console.log( data );
    console.log( envelope );

    this._task = data.task;
    this._step = data.step;
    this._context = data.context;

    console.groupEnd();
  }

  onAction(event) {
    this._postService.publish( _.assign( {}, PUB_EVENTS.triggerAction, { data : {action: event} } ) );
  }
}
