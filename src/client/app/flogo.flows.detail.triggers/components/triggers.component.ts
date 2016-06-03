import { Component } from '@angular/core';
import { PostService } from '../../../common/services/post.service';
import { TRIGGERS as TRIGGERS_MOCK } from '../mocks/triggers';
import { PUB_EVENTS, SUB_EVENTS } from '../messages';
import { RouteParams } from '@angular/router-deprecated';

import {FlogoFlowsDetailTriggersInstallComponent as TriggersInstallerComponent} from '../../flogo.flows.detail.triggers.install/components/install.component';
import {RESTAPITriggersService} from '../../../common/services/restapi/triggers-api.service';

@Component(
  {
    selector : 'flogo-flows-detail-triggers',
    moduleId : module.id,
    directives: [TriggersInstallerComponent],
    templateUrl : 'triggers.tpl.html',
    styleUrls : [ 'triggers.component.css' ]
  }
)
export class FlogoFlowsDetailTriggers {
  private triggers : any;
  private _subscriptions : any;
  private _addTriggerMsg : any;
  private _selectTriggerMsg : any;

  constructor( private _postService : PostService, private _routeParams : RouteParams, private _restAPITriggersService: RESTAPITriggersService ) {
    console.group( 'Constructing FlogoFlowsDetailTasks' );

    console.log( this._routeParams );

    this.initSubscribe();
    this._loadTriggers();

    //this.triggers = TRIGGERS_MOCK || [];

    console.groupEnd();
  }

  private initSubscribe() {
    this._subscriptions = [];

    let subs = [
      _.assign( {}, SUB_EVENTS.addTrigger, { callback : this._getAddTriggerMsg.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.selectTrigger, { callback : this._getSelectTriggerMsg.bind( this ) } )
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

  private _getAddTriggerMsg( data : any, envelope : any ) {
    console.group( 'Add trigger message in triggers' );

    console.log( data );
    console.log( envelope );

    this._addTriggerMsg = data;

    console.groupEnd();
  }

  private _getSelectTriggerMsg( data : any, envelope : any ) {
    console.group( 'Select trigger message in triggers' );

    console.log( data );
    console.log( envelope );

    this._selectTriggerMsg = data;

    console.groupEnd();
  }

  sendAddTriggerMsg( trigger : any ) {
    this._postService.publish(
      _.assign(
        {}, PUB_EVENTS.addTrigger, {
          data : _.assign( {}, this._addTriggerMsg, { trigger : _.cloneDeep( trigger ) } )
        }
      )
    );
  }

  private _loadTriggers() {
    console.log('Loading triggers');

    this._restAPITriggersService.getTriggers()
      .then(
        ( triggers : any )=> {
          this.triggers = triggers;
        }
      )
      .catch(
        ( err : any )=> {
          console.error( err );
        }
      );
  }

}
