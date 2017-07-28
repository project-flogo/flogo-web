import { Component, ElementRef, SimpleChange, AfterViewInit, EventEmitter } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';

import { FlogoFlowDiagram, IFlogoFlowDiagramTaskDictionary, IFlogoFlowDiagram } from '../models';
import { PostService } from '../../../common/services/post.service';
import { PUB_EVENTS, SUB_EVENTS } from '../messages';
import { PUB_EVENTS as SUB_EVENTS_ADD_TRIGGER } from '../../flogo.select-trigger/messages'
import { PUB_EVENTS as PUB_EVENTS_ADD_TRIGGER } from '../../flogo.flows.detail.triggers/messages';
import { FLOGO_FLOW_DIAGRAM_NODE_TYPE, FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE } from '../constants';
import { FLOGO_TASK_TYPE } from '../../../common/constants';
import { FlogoFlowDiagramNode } from '../models/node.model';

@Component(
  {
    selector : 'flogo-canvas-flow-diagram',
    // moduleId : module.id,
    templateUrl : 'diagram.tpl.html',
    styleUrls : [ 'diagram.component.less' ],
    inputs : [
      'tasks',
      'diagram',
       'id',
      'appDetails'
    ]
  }
)
export class FlogoFlowsDetailDiagramComponent implements AfterViewInit {

  public tasks : IFlogoFlowDiagramTaskDictionary;
  public diagram : IFlogoFlowDiagram;
  public id: string;
  public appDetails: string;

  private _elmRef : ElementRef;
  private _diagram : FlogoFlowDiagram;
  private _subscriptions : any[ ];
  public enabledSelectTrigger: boolean = false;

  constructor( elementRef : ElementRef, private _postService : PostService, private _translate : TranslateService ) {
    this.enabledSelectTrigger = false;
    this._elmRef = elementRef;
    this.initSub();
  }


  private initSub() {
    if ( _.isEmpty( this._subscriptions ) ) {
      this._subscriptions = [];
    }

    if ( !this._postService ) {
      console.error( 'No PostService Found..' );
      return;
    }

    let subs = [
      _.assign( {}, SUB_EVENTS.addTrigger, { callback : this._addTriggerDone.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.selectTrigger, { callback : this._selectTriggerDone.bind( this ) } ),
      _.assign( {}, SUB_EVENTS_ADD_TRIGGER.addTrigger, { callback : this.selectModalTrigger.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.addTask, { callback : this._addTaskDone.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.selectTask, { callback : this._selectTaskDone.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.deleteTask, { callback : this._deleteTaskDone.bind( this ) } ),
      _.assign( {}, SUB_EVENTS.render, {
        callback : function () {
          this._diagram.render();
        }.bind( this )
      } ),
      _.assign( {}, SUB_EVENTS.addBranch, { callback : this._addBranchDone.bind( this ) } ),
    ];

    _.each(
      subs, ( sub ) => {
        this._subscriptions.push( this._postService.subscribe( sub ) );
      }
    );
  }

  private unsub() {
    if ( _.isEmpty( this._subscriptions ) ) {
      return true;
    }

    _.each(
      this._subscriptions, ( sub ) => {
        this._postService.unsubscribe( sub );
      }
    );

    return true;
  }

  ngAfterViewInit() {
    let _enabledSelectTrigger = false;
    if ( _.isEmpty( this.diagram ) || _.isEmpty( this.diagram.root ) ) {
      this.diagram = FlogoFlowDiagram.getEmptyDiagram(this.id == 'errorHandler' ? 'error' : null );
      if(this.id == 'errorHandler') {
      } else {
        _enabledSelectTrigger = true;
      }
      this._diagram = new FlogoFlowDiagram( this.diagram, this.tasks, this._translate,  this._elmRef.nativeElement, this.id == 'errorHandler' ? 'error' : null );
    } else {
      this._diagram = new FlogoFlowDiagram( this.diagram, this.tasks, this._translate,  this._elmRef.nativeElement, this.id == 'errorHandler' ? 'error' : null );
    }
    // Render the diagram on next js cycle such that the diagram elements are added to the DOM.
    setTimeout(() => {
      this.enabledSelectTrigger = _enabledSelectTrigger;
      // todo: remove once selector is extracted from here
      if(!_enabledSelectTrigger) {
        this._diagram.render();
      }
    }, 0);
  }



  ngOnChanges(
    changes : {
      [ propKey : string ] : SimpleChange
    }
  ) {

    console.log( changes );

    // TODO
    //   WARN: multiple rendering warning:
    //     note that these change monitor may trigger render while the
    //     subscriptions of onAfterEditTask and onAfterAddTask may do the same thing.
    //     may need optimisation later
    // only trigger the render for single time per change
    // monitor the updates of diagram
    if ( changes[ 'diagram' ] ) {

      console.groupCollapsed( 'Updated diagram' );
      console.log( this.diagram );
      console.groupEnd();

      if ( this.diagram && this.tasks && this._diagram ) {
        this._diagram.updateAndRender( {
            tasks : this.tasks,
            diagram : this.diagram
          } )
          .then( ( diagram )=> {
            this._diagram = diagram;
          } );
      }

      // monitor the updates of tasks
    } else if ( changes[ 'tasks' ] ) {

      console.groupCollapsed( 'Updated tasks' );
      console.log( this.tasks );
      console.groupEnd();

      if ( this.diagram && this.tasks && this._diagram ) {
        this._diagram.updateAndRender( {
            tasks : this.tasks
          } )
          .then( ( diagram )=> {
            this._diagram = diagram;
          } );
      }
    }

  }

  private _afterEditTaskHandler( data : any ) {

    console.group( '_afterEditTaskHandler' );
    console.log( data );

    // the tasks should have been passed into this component after changing
    // so re-render the diagram
    this._diagram.updateAndRender( {
        tasks : this.tasks
      } )
      .then( ( diagram )=> {
        this._diagram = diagram;
      } );

    // TODO
    //   if there are nodes position changing, then should apply the new diagram when updating
    // this._diagram.updateAndRender( {
    //   tasks: this.tasks,
    //   diagram: this.diagram
    // } );

    console.groupEnd();
  }

  ngOnDestroy() {
    // TODO

    this.unsub();
  }

  // forwarding event
  addTask( $event : any ) {
    // TODO
    console.group( 'forwarding add task event' );

    console.log( $event );

    let data = $event.detail;
    data.id = this.id;

    if ( data.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW ) {
      // add trigger event
      this._postService.publish( _.assign( {}, PUB_EVENTS.addTrigger, { data : data } ) );
    } else if ( data.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD ) {
      // add task event
      this._postService.publish( _.assign( {}, PUB_EVENTS.addTask, { data : data } ) );
    } else {
      console.warn( 'unknown event type' );
    }

    console.groupEnd();
  }

  // forwarding event
  selectTask( $event : any ) {
    // TODO
    console.group( 'forwarding select task event' );
    console.log( $event );

    let data = $event.detail;
    data.id = this.id;

    // TODO
    //   need to support link and other nodes
    if ( data.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT || data.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW ) {
      // select trigger event
      this._postService.publish( _.assign( {}, PUB_EVENTS.selectTrigger, { data : data } ) );
    } else if ( data.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE ) {
      // select task event
      this._postService.publish( _.assign( {}, PUB_EVENTS.selectTask, { data : data } ) );
    } else if ( data.node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
      // select branch event
      this._postService.publish( _.assign( {}, PUB_EVENTS.selectBranch, { data : data } ) );
    } else {
      console.warn( 'unknown event type, yet' );
    }

    console.groupEnd();
  }

  // forwarding event based on item type
  onMenuItemClicked( $event : any ) {
    console.group( 'forwarding menu item clicked event' );
    let menuItemType = $event.detail.origEvent.target.getAttribute( 'data-menu-item-type' );

    if ( _.isEmpty( menuItemType ) ) {
      console.warn( 'Invalid data menu item type.' );
    } else {
      let data = $event.detail;
      data.id = this.id;

      switch ( Number( menuItemType ) ) {
        case FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE.ADD_BRANCH:
          this._postService.publish( _.assign( {}, PUB_EVENTS.addBranch, { data : data } ) );
          break;
        case FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE.SELECT_TRANSFORM:
          this._postService.publish( _.assign( {}, PUB_EVENTS.selectTransform, { data : data } ) );
          break;
        case FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE.DELETE:
          this._postService.publish( _.assign( {}, PUB_EVENTS.deleteTask, { data : data } ) );
          break;
      }
    }
    console.groupEnd();
  }

  private _addTriggerDone( data : any, envelope : any ) {
    if(!this.raisedByThisDiagram(data.id)) {
      return;
    }

    console.group( 'Add Trigger Done' );

    console.log( data );
    console.log( envelope );

    this._associateNodeWithTaskAndUpdateDiagram( data )
      .then( () => {
        _.isFunction( envelope.done ) && envelope.done( this._diagram );
      } )
      .then( () => {
        // navigate to add task
        return this._diagram.triggerByTaskID( 'selectTrigger', data.task.id );
      } )
      .catch( ( err : any ) => {
        console.error( err );
      } );

    console.groupEnd();
  }

  private _addTaskDone( data : any, envelope : any ) {
    if(!this.raisedByThisDiagram(data.id)) {
      return;
    }
    console.group( 'Add Task Done' );

    console.log( data );
    console.log( envelope );

    this._associateNodeWithTaskAndUpdateDiagram( data )
      .then( () => {
        _.isFunction( envelope.done ) && envelope.done( this._diagram );
      } )
      .then( () => {
        // navigate to add task
        return this._diagram.triggerByTaskID( 'selectTask', data.task.id );
      } )
      .catch( ( err : any ) => {
        console.error( err );
      } );

    console.groupEnd();
  }


  private selectModalTrigger( data : any, envelope : any ) {
    this.enabledSelectTrigger = false;

    this._postService.publish(
        _.assign(
          {}, PUB_EVENTS_ADD_TRIGGER.addTrigger, {
            data : _.assign( {}, { id: 'root', col: 0, row: 0 },
              { node: this.diagram.nodes[this.diagram.root.is] },
              { trigger : _.cloneDeep( data.trigger ) },
              { installType: data.installType }),
          }
        )
    );
  }

  private _selectTriggerDone( data : any, envelope : any ) {
    if(!this.raisedByThisDiagram(data.id)) {
      return;
    }
    console.group( 'Select Trigger Done' );

    console.log( data );
    console.log( envelope );

    this._associateNodeWithTaskAndUpdateDiagram( data )
      .then(
        () => {
          _.isFunction( envelope.done ) && envelope.done( this._diagram );
        }
      );

    console.groupEnd();
  }

  private raisedByThisDiagram(id:string) {
    return this.id === (id || '');
  }

  private _selectTaskDone( data : any, envelope : any ) {
    if(!this.raisedByThisDiagram(data.id)) {
      return;
    }

    //if(this.id !== data.id || '')  {
    //  return;
    //}

    console.group( 'Select task Done' );

    console.log( data );
    console.log( envelope );

    this._associateNodeWithTaskAndUpdateDiagram( data )
      .then(
        () => {
          _.isFunction( envelope.done ) && envelope.done( this._diagram );
        }
      );


    console.groupEnd();
  }

  private _deleteTaskDone( data : any, envelope : any ) {
    if(!this.raisedByThisDiagram(data.id)) {
      return;
    }
    console.group( 'Delete task done.' );

    console.log( data );
    console.log( envelope );

    let node = <FlogoFlowDiagramNode>this._diagram.nodes[ _.get( data, 'node.id', '' ) ];

    if ( node ) {
      this._diagram.deleteNode( node )
        .then( ( diagram : FlogoFlowDiagram )=> {
          if ( diagram && _.isFunction( diagram.render ) ) {
            return this._diagram.render();
          } else {
            return diagram;
          }
        } )
        .then( ( diagram )=> {
          this._diagram = diagram;
          _.isFunction( envelope.done ) && envelope.done( this._diagram );
        } );
    }

    console.groupEnd();
  }

  /**
   * Update the task information, link the node with the task, and then update & render the diagram
   *
   * @param data
   * @private
   */
  private _associateNodeWithTaskAndUpdateDiagram( data : any ) : Promise<any> {
    if ( data.node && data.task ) {
      // link the new task to FlogoFlowDiagramNode
      return this._diagram.linkNodeWithTask( data.node.id, data.task )
        .then( ( diagram ) => {
          return diagram.updateAndRender(
            {
              tasks : this.tasks
            } )
            .then( ( diagram )=> {
              this._diagram = diagram;
            } );
        } );
    }

    // link the trigger with the root node with node id omitted
    // this should make the ../trigger/add deeplinking work

    if ( data.task && data.task.type === FLOGO_TASK_TYPE.TASK_ROOT ) {
      // link the trigger to FlogoFlowDiagramNode
      return this._diagram.linkNodeWithTask( this._diagram.root.is, data.task )
        .then( ( diagram ) => {
          return diagram.updateAndRender( {
              tasks : this.tasks
            } )
            .then( ( diagram )=> {
              this._diagram = diagram;
            } );
        } );
    }

    return Promise.reject( 'Invalid parameters.' );
  }

  private _addBranchDone( data : any, envelope : any ) {
    if(!this.raisedByThisDiagram(data.id)) {
      return;
    }
    console.group( 'Add branch done.' );

    console.log( data );
    console.log( envelope );

    let node = <FlogoFlowDiagramNode>this._diagram.nodes[ _.get( data, 'node.id', '' ) ];

    // if node is of add type and task is of branch type
    if ( node &&
      (_.get( data, 'task.type', -1 ) === FLOGO_TASK_TYPE.TASK_BRANCH) &&
      (_.get( data, 'node.type', '' )) ) {

      this._diagram.addBranch( data.node, data.task )
        .then( ( diagram ) => {
          return diagram.updateAndRender(
            {
              tasks : this.tasks
            } )
            .then( ( diagram : FlogoFlowDiagram )=> {
              this._diagram = diagram;
            } );
        } )
        .then( () => {
          return _.isFunction( envelope.done ) && envelope.done( this._diagram );
        } )
        .then( () => {
          // navigate to add task
          return this._diagram.triggerByTaskID('addTask', data.task.id);
        } )
        .catch( ( err : any ) => {
          console.error( err );
        } );
    }

    console.groupEnd();
  }
}
