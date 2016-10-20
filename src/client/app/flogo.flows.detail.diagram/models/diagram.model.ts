import {
  IFlogoFlowDiagramRootNode,
  IFlogoFlowDiagramNodeDictionary,
  IFlogoFlowDiagramTaskDictionary,
  IFlogoFlowDiagramNode,
  FlogoFlowDiagramNode,
  IFlogoFlowDiagramTask
} from '../models';
import { Selection } from 'd3';
import { FLOGO_FLOW_DIAGRAM_NODE_TYPE, FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE } from '../constants';
import { FLOGO_TASK_TYPE } from '../../../common/constants';
import { FLOGO_FLOW_DIAGRAM_DEBUG as DEBUG } from '../constants';
import { FLOGO_FLOW_DIAGRAM_VERBOSE as VERBOSE } from '../constants';
import { genBranchLine } from '../../../common/utils';
import { TranslatePipe, TranslateService } from 'ng2-translate/ng2-translate';

//import * as moment from 'moment';

export interface IFlogoFlowDiagram {
  root : IFlogoFlowDiagramRootNode;
  nodes : IFlogoFlowDiagramNodeDictionary;
  MAX_ROW_LEN? : number;
}

const DEFAULT_MAX_ROW_LEN = 7;

const CLS = {
  diagram : 'flogo-flows-detail-diagram',
  diagramRow : 'flogo-flows-detail-diagram-row',
  diagramRowStatusSelected : 'flogo-flows-detail-diagram-row-selected',
  diagramNode : 'flogo-flows-detail-diagram-node',
  diagramNodeBranchHover : 'flogo-flows-diagram-node-branch-hover',
  diagramNodeStatusSelected : 'flogo-flows-detail-diagram-node-selected',
  diagramNodeStatusRun : 'flogo-flows-detail-diagram-node-run',
  diagramNodeStatusHasError : 'flogo-flows-detail-diagram-node-has-error',
  diagramNodeStatusHasWarn : 'flogo-flows-detail-diagram-node-has-warn',
  diagramNodeDetail : 'flogo-flows-detail-diagram-node-detail',
  diagramNodeDetailBranch : 'flogo-flows-detail-diagram-node-detail-branch',
  diagramNodeDetailBranchSelected : 'flogo-flows-detail-diagram-node-detail-branch-selected',
  diagramNodeDetailBranchHover : 'flogo-flows-detail-diagram-node-detail-branch-hover',
  diagramNodeDetailBranchRun : 'flogo-flows-detail-diagram-node-detail-branch-run',
  diagramNodeDetailIcon : 'flogo-flows-detail-diagram-node-detail-icon',
  diagramNodeDetailTitle : 'flogo-flows-detail-diagram-node-detail-title',
  diagramNodeDetailDesc : 'flogo-flows-detail-diagram-node-detail-description',
  diagramNodeBadge : 'flogo-flows-detail-diagram-node-badge',
  diagramNodeMenu : 'flogo-flows-detail-diagram-node-menu',

  // comment out since hover will show the menu
  // diagramNodeMenuOpen : 'flogo-flows-detail-diagram-node-menu-open',
  // diagramNodeMenuSelected : 'flogo-flows-detail-diagram-node-menu-selected',

  diagramNodeMenuBox : 'flogo-flows-detail-diagram-node-menu-box',
  diagramNodeMenuList : 'flogo-flows-detail-diagram-node-menu-list',
  diagramNodeMenuGear : 'flogo-flows-detail-diagram-node-menu-gear'
};

export class FlogoFlowDiagram implements IFlogoFlowDiagram {
  public root : IFlogoFlowDiagramRootNode;
  public nodes : IFlogoFlowDiagramNodeDictionary;
  public MAX_ROW_LEN = DEFAULT_MAX_ROW_LEN;

  private rootElm : Selection < any >;
  private ng2StyleAttr = '';
  private nodesOfAddType : IFlogoFlowDiagramNodeDictionary;

  constructor( diagram : IFlogoFlowDiagram,
    private tasks : IFlogoFlowDiagramTaskDictionary,
    private translate: TranslateService,
    private elm ? : HTMLElement,
    private diagramType? : string) {
    this.updateDiagram( diagram );
  }

  static isBranchNode( node : IFlogoFlowDiagramNode ) {
    return _isBranchNode( node );
  }

  static hasBranchRun( node : IFlogoFlowDiagramNode,
    tasks : IFlogoFlowDiagramTaskDictionary,
    nodes : IFlogoFlowDiagramNodeDictionary ) : boolean {

    // expose internal function.
    return _hasBranchRun( node, tasks, nodes );
  }

  static transformDiagram( diagram : IFlogoFlowDiagram ) : string[ ][ ] {
    let matrix : string[ ][ ] = [];

    // find the root node
    let root : IFlogoFlowDiagramNode; // diagram node
    if ( diagram && diagram.root && diagram.root.is ) {
      root = diagram.nodes[ diagram.root.is ];
    }

    // if there is no root, then it's an empty diagram
    if ( !root ) {
      return matrix;
    }

    // add the root to the first row of the matrix
    matrix.push( [ root.id ] );

    // handling children of root
    _insertChildNodes( matrix, diagram, root );

    DEBUG && console.groupCollapsed( 'matrix' );
    DEBUG && console.log( matrix );
    DEBUG && console.groupEnd();

    return matrix;
  }

  // pad display matrix with nodes of add type and placeholder type
  static padMatrix( matrix : string [][], rowLen = DEFAULT_MAX_ROW_LEN, diagram : IFlogoFlowDiagram ) : string[][] {
    let outputMatrix : string[][] = [];

    _.each(
      matrix, ( matrixRow ) => {
        if ( matrixRow.length < rowLen ) {

          let paddedRow : string[];

          if ( matrixRow.length
            === 1
            && diagram.nodes[ matrixRow[ 0 ] ].type
            === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW ) {
            paddedRow = matrixRow;
          } else {
            paddedRow = matrixRow.concat( '+' ); // append add node symbol
          }

          let rowLenDiff = rowLen - paddedRow.length;
          let paddingArr = _.fill( Array( rowLenDiff ), '_' );
          outputMatrix.push( paddedRow.concat( paddingArr ) );

        } else {
          // TODO
          // ignore for the moment, assuming that the row won't be overflow
          // and the overflow case should be handled somewhere else.

          outputMatrix.push( matrixRow )
        }
      }
    );

    return outputMatrix;
  }

  static getEmptyDiagram(diagramType?:string) : IFlogoFlowDiagram {
    let newRootNode = new FlogoFlowDiagramNode();
    let emptyDiagram = < IFlogoFlowDiagram > {
      root : {
        is : newRootNode.id
      },
      nodes : < IFlogoFlowDiagramNodeDictionary > {}
    };

    newRootNode.type = diagramType == 'error' ? FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW;

    emptyDiagram.nodes[ newRootNode.id ] = newRootNode;

    return emptyDiagram;
  }

  static filterOverflowAddNode( matrix : string[][],
    nodes : IFlogoFlowDiagramNodeDictionary,
    rowLen = DEFAULT_MAX_ROW_LEN ) : string[][] {
    let outputMatrix = _.cloneDeep( matrix );

    _.each(
      outputMatrix, ( matrixRow : string[] ) => {

        if ( matrixRow.length > rowLen ) {

          let diffRowLen = matrixRow.length - rowLen;
          let node : IFlogoFlowDiagramNode;

          while ( diffRowLen ) {
            let node = nodes[ matrixRow[ matrixRow.length - 1 ] ];

            if ( node && (
                node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD ||
                node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW
              ) ) {
              matrixRow.pop();
            }

            diffRowLen--;
          }

        }

      }
    );


    return outputMatrix;
  }

  public update( opt : {
    diagram ? : IFlogoFlowDiagram;
    tasks ? : IFlogoFlowDiagramTaskDictionary;
    element ? : HTMLElement;
  } ) : Promise < FlogoFlowDiagram > {
    let promises : Promise < FlogoFlowDiagram > [ ] = [];

    if ( opt.diagram ) {
      promises.push( this.updateDiagram( opt.diagram ) );
    }

    if ( opt.tasks ) {
      promises.push( this.updateTasks( opt.tasks ) );
    }

    if ( opt.element ) {
      promises.push( this.updateElement( opt.element ) );
    }

    return Promise.all( promises )
      .then( () => this );
  }

  public updateAndRender( opt : {
    diagram ? : IFlogoFlowDiagram;
    tasks ? : IFlogoFlowDiagramTaskDictionary;
    element ? : HTMLElement;
  } ) : Promise < FlogoFlowDiagram > {
    return this.update( opt )
      .then(
        () => {
          return this.render();
        }
      );
  }

  public updateDiagram( diagram : IFlogoFlowDiagram ) : Promise < FlogoFlowDiagram > {
    if ( _.isEmpty( diagram ) || _.isEmpty( diagram.root ) ) {

      // handle empty diagram
      this.updateDiagram( FlogoFlowDiagram.getEmptyDiagram(this.diagramType) );

    } else {

      // handle diagram with trigger and more nodes

      // keep a copy of diagram information, but only keep the reference of the tasks
      this.root = _.cloneDeep( diagram.root );

      // convert FlogoNode object into instance of FlogoNode class
      let nodeDict : IFlogoFlowDiagramNodeDictionary = {};
      _.forIn( diagram.nodes, ( node, nodeID ) => {
        if ( node instanceof FlogoFlowDiagramNode ) {
          nodeDict[ nodeID ] = node;
        } else {
          nodeDict[ nodeID ] = new FlogoFlowDiagramNode( node );
        }
      } );
      this.nodes = nodeDict;

      this.MAX_ROW_LEN = _.isNumber( diagram.MAX_ROW_LEN ) ? diagram.MAX_ROW_LEN : this.MAX_ROW_LEN;
    }


    return Promise.resolve( this );
  }

  public updateTasks( tasks : IFlogoFlowDiagramTaskDictionary ) : Promise < FlogoFlowDiagram > {
    this.tasks = tasks;
    return Promise.resolve( this );
  }

  public updateElement( elm : HTMLElement ) : Promise < FlogoFlowDiagram > {
    d3.select( this.elm )
      .select( `.${CLS.diagram}` )
      .selectAll( `.${CLS.diagramRow}` )
      .remove(); // clean the previous diagram
    this.elm = elm;
    return Promise.resolve( this );
  }

  private _bindDataToRows( rows : any ) {
    return rows.data(
      FlogoFlowDiagram.filterOverflowAddNode(
        FlogoFlowDiagram.padMatrix(
          FlogoFlowDiagram.transformDiagram( this ), this.MAX_ROW_LEN, this
        ), this.nodes
      )
    );
  }

  private _handleEnterRows( rows : any ) {
    let enterRows = rows
      .enter()
      .append( 'div' )
      .attr( this.ng2StyleAttr, '' )
      .classed( CLS.diagramRow, true )
      .style( 'z-index', ( d : any, row : number ) => rows.size() - row ) // the earlier rendered row is higher
      .on(
        'mouseenter', function () {
          d3.select( this )
            .classed( 'hover', true );
        }
      )
      .on(
        'mouseleave', function () {
          d3.select( this )
            .classed( 'hover', false );
        }
      );
  }

  private _handleUpdateRows( rows : any ) {
    rows.classed( 'updated', true );

    let tasks = this._bindDataToNodes( rows );

    this._handleTaskNodes( tasks, rows );
  }

  private _handleExitRows( rows : any ) {
    rows.exit()
      .classed(
        {
          'updated' : false,
          'exit' : true
        }
      )
      .on( 'mouseenter', null )
      .on( 'mouseleave', null )
      .remove();
  }

  private _bindDataToNodes( rows : any ) {
    let nodes = rows.selectAll( `.${CLS.diagramNode}` );

    return nodes.data( ( rowNodesIds : string[ ] ) => {
      return _.map(
        rowNodesIds, ( nodeID : string, idx : number ) => {
          let nodeInfo = <FlogoFlowDiagramNode>this.nodes[ nodeID ];

          if ( nodeID === '+' ) {
            // node of NODE_ADD

            // reuse existing nodes
            let found = false;
            _.forIn( this.nodesOfAddType, ( node : FlogoFlowDiagramNode, id : string ) => {
              if ( node.parents.indexOf( rowNodesIds[ idx - 1 ] ) !== -1 ) {
                found = true;
                nodeInfo = node;
              }
            } );

            if ( !found ) {
              nodeInfo = new FlogoFlowDiagramNode();
              this.nodesOfAddType[ nodeInfo.id ] = nodeInfo;
              // only save the parent IDs to this node, but not add this node to the children of the parent node,
              // in order to keep the diagram itself clean.
              nodeInfo.linkToParents( [ rowNodesIds[ idx - 1 ] ] );
            }
          } else if ( nodeID === '_' ) {
            // placeholder node
            nodeInfo = new FlogoFlowDiagramNode( {
              id : '',
              taskID : '',
              type : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_HOLDER,
              children : [],
              parents : []
            } );
          } else if ( _.isEmpty( nodeInfo ) ) {
            // padding nodes
            nodeInfo = new FlogoFlowDiagramNode( {
              id : '',
              taskID : '',
              type : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_PADDING,
              children : [],
              parents : []
            } );
          }

          return nodeInfo;
        }
      );
    } );
  }

  private _handleEnterNodes( nodes : any, rows : any ) {
    let diagram = this;
    // let timerHandle : any = {};

    let dontCareNodesTypesForNodeMenu = [
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD,
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_HOLDER,
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW,
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_PADDING,
      FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW
    ];

    // enter selection
    let newNodes = nodes.enter()
      .append( 'div' )
      .attr( 'data-task-id', ( nodeInfo : IFlogoFlowDiagramNode ) => {
        return nodeInfo.taskID || -1
      } )
      .attr( this.ng2StyleAttr, '' )
      .classed( CLS.diagramNode, true )
      .on(
        'click', function ( d : IFlogoFlowDiagramNode, col : number, row : number ) {
          DEBUG && console.group( 'on click' );

          DEBUG && console.group( 'node data' );
          // DEBUG && console.table( d );
          DEBUG && console.log( d );
          DEBUG && console.groupEnd();

          if ( d.taskID ) {
            DEBUG && console.group( 'task data' );
            DEBUG && console.log( diagram.tasks[ d.taskID ] );
            DEBUG && console.groupEnd();
          }

          DEBUG && console.group( 'location in matrix' );
          DEBUG && console.log( `row: ${row + 1}, col: ${col + 1}` );
          DEBUG && console.groupEnd();

          DEBUG && console.group( 'event' );
          DEBUG && console.log( d3.event );
          DEBUG && console.groupEnd();

          if ( _isNodeSelectable(d) ) {

            let evtType = '';

            if ( d.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD ||
              d.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW ) {
              evtType = 'flogoAddTask';

              // TODO
              //   refine the logic to handle more kinds of nodes
            } else if ( [
                FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE,
                FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT,
                FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH,
              ].indexOf( d.type ) !== -1 ) {
              evtType = 'flogoSelectTask';
            }

            if ( evtType ) {
              _triggerCustomEvent(
                evtType, {
                  origEvent : d3.event,
                  node : d,
                  col : col,
                  row : row
                }, this
              );

            }

            d3.selectAll( `.${CLS.diagramNodeStatusSelected}` )
              .classed( CLS.diagramNodeStatusSelected, ( nodeInfo : any ) => {
                _.set(nodeInfo, '__status.isSelected', false);
                return false;
              } );
            d3.selectAll( `.${CLS.diagramRowStatusSelected}` )
              .classed( CLS.diagramRowStatusSelected, false );

            d3.select( this )
              .classed( CLS.diagramNodeStatusSelected, ( nodeInfo : any ) => {
                _.set(nodeInfo, '__status.isSelected', true);
                return true;
              } );

            if ( d.type !== FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
              d3.select( this.parentElement )
                .classed( CLS.diagramRowStatusSelected, true );
            }
          }

          DEBUG && console.groupEnd();
        }
      )
      .on(
        'mouseenter', function ( d : IFlogoFlowDiagramNode ) {
          let element : HTMLElement = this;

          if ( dontCareNodesTypesForNodeMenu.indexOf( d.type ) !== -1 ) {
            return;
          }

          if ( d.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
            let doneFlag = false;
            d3.select( diagram.elm )
              .selectAll( `.${CLS.diagramRow}` )
              .each( function ( rowNodesIDs : string[], row : number ) {
                if ( !doneFlag && rowNodesIDs.indexOf( d.id ) !== -1 ) {
                  d3.select( this )
                    .classed( CLS.diagramNodeBranchHover, true )
                    .style( 'z-index', () => rows.size() + 1 );
                  doneFlag = true;
                }
              } );
          }

          // comment out since hover will show the menu
          // timerHandle[ d.id ] = setTimeout(
          //   () => {
          //     d3.select( element )
          //       .classed( CLS.diagramNodeMenuOpen, true );
          //   }, 250
          // );
        }
      )
      .on(
        'mouseleave', function ( d : IFlogoFlowDiagramNode ) {
          // clearTimeout( timerHandle[ d.id ] );

          // comment out since hover will show the menu
          // d3.select( this )
          //   .classed( CLS.diagramNodeMenuOpen, false )
          //   .classed( CLS.diagramNodeMenuSelected, false );

          if ( d.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
            d3.selectAll( `.${CLS.diagramNodeBranchHover}` )
              .classed( CLS.diagramNodeBranchHover, false );
          }

          if ( d.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
            let doneFlag = false;
            d3.select( diagram.elm )
              .selectAll( `.${CLS.diagramRow}` )
              .each( function ( rowNodesIDs : string[], row : number ) {
                if ( !doneFlag && rowNodesIDs.indexOf( d.id ) !== -1 ) {
                  d3.select( this )
                    .style( 'z-index', () => rows.size() - row );
                  doneFlag = true;
                }
              } );
          }
        }
      );
      // comment out since hover will show the menu
      // .on(
      //   'flogoClickNodeMenu', function ( nodeInfo : any ) {
      //     d3.select( this )
      //       .classed( CLS.diagramNodeMenuSelected, true );
      //   }
      // );
  }

  private _handleUpdateNodes( nodes : any, rows : any ) {
    let diagram = this;

    // comment out since hover will show the menu
    // nodes.classed( CLS.diagramNodeMenuOpen, false )
    nodes.classed( {
        'updated' : true
      } )
      .attr( 'data-flogo-node-type',
        ( d : IFlogoFlowDiagramNode ) => FLOGO_FLOW_DIAGRAM_NODE_TYPE[ d.type ].toLowerCase() );

    nodes.each(
      function ( d : IFlogoFlowDiagramNode ) {
        let thisNode = d3.select( this );
        let task = diagram.tasks && diagram.tasks[ d.taskID ];
        let classes : {[key : string] : boolean} = {};

        // status for resetting
        classes[ CLS.diagramNodeStatusRun ] = false;
        classes[ CLS.diagramNodeStatusHasError ] = false;
        classes[ CLS.diagramNodeStatusHasWarn ] = false;

        if ( task ) {
          let taskStatus = _getTaskStatus( task );

          classes[ CLS.diagramNodeStatusRun ] = taskStatus[ 'hasRun' ];
          classes[ CLS.diagramNodeStatusHasError ] = taskStatus.hasError;
          classes[ CLS.diagramNodeStatusHasWarn ] = taskStatus.hasWarning;
          thisNode.classed( classes );

        } else {
          thisNode.classed( classes );
        }

        // comment out since hover will show the menu
        // thisNode.classed( CLS.diagramNodeMenuSelected, false );

        thisNode.classed( CLS.diagramNodeStatusSelected, ( nodeInfo : any ) => {
          return _.get( nodeInfo, '__status.isSelected', false );
        } );

        // update the current node ID
        thisNode.attr( 'data-task-id', function ( nodeInfo : IFlogoFlowDiagramNode ) {
          let previousID = thisNode.attr( 'data-task-id' );

          // unset whatever status should not be kept once the task is changed.
          if ( previousID !== nodeInfo.taskID ) {
            // persist node selected status
            thisNode.classed( CLS.diagramNodeStatusSelected, ( nodeInfo : any ) => {
              return _.get( nodeInfo, '__status.isSelected', false );
            } );
          }

          return nodeInfo.taskID || -1
        } );
      }
    );

    // if no node is selected, unset the row selected class
    if ( !_.some( d3.selectAll( `.${CLS.diagramNodeStatusSelected}` )
        .data(), ( nodesInfo : any ) => {
        return nodesInfo && (nodesInfo.type
          === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE
          || nodesInfo.type
          === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT);
      } ) ) {
      d3.select( `.${CLS.diagramRowStatusSelected}` )
        .classed( CLS.diagramRowStatusSelected, false );
    }

    let nodeMenus = this._bindDataToNodeMenus( nodes.selectAll( `.${CLS.diagramNodeMenu}` ) );
    this._handleNodeMenus( nodeMenus );

    let nodeDetails = this._bindDataToNodeDetails( rows );
    this._handleNodeDetails( nodeDetails, rows );

    let nodeBadgeArea = this._bindDataToNodeBadges( nodes.selectAll( `.${CLS.diagramNodeBadge}` ) );
    this._handleNodeBadges( nodeBadgeArea );

  }

  private _handleExitNodes( nodes : any, rows : any ) {
    nodes.exit()
      .classed(
        {
          'updated' : false,
          'exit' : true
        }
      )
      .on( 'click', null )
      .on( 'mouseover', null )
      .on( 'mouseleave', null )
      .on( 'flogoClickNodeMenu', null )
      .remove();
  }

  private _handleTaskNodes( tasks : any, rows : any ) {

    this._handleEnterNodes( tasks, rows );
    this._handleUpdateNodes( tasks, rows );
    this._handleExitNodes( tasks, rows );

  }

  private _bindDataToNodeDetails( rows : any ) : any {
    let nodeDetails = rows.selectAll( `.${CLS.diagramNode}` )
      .selectAll( `.${CLS.diagramNodeDetail}` );
    return nodeDetails.data(
      ( nodeInfo : any )=> {
        if ( nodeInfo ) {
          let task = this.tasks[ nodeInfo.taskID ];

          if ( task && _isNodeHasDetails( nodeInfo ) ) {
            let taskDescription : string;
            let taskStatus = _getTaskStatus( task );

            // the first message of error/warning will be used as description when presents
            // NOTE: not going to display error messages in the
            // if ( taskStatus.hasError ) {
            //   let _errors = _.get( task, '__props.errors', [ { msg : '' } ] );
            //   taskDescription = _errors[ 0 ].msg;
            // } else
            if ( taskStatus.hasWarning ) {
              let _warnings = _.get( task, '__props.warnings', [ { msg : '' } ] );
              taskDescription = _warnings[ 0 ].msg;
            } else {
              taskDescription = task.description;
            }

            return <any>[
              {
                name : task.name,
                desc : taskDescription,
                type : task.type,
                taskStatus : taskStatus,
                nodeInfo : nodeInfo
              }
            ]
          }
        }

        return <any>[
          {
            nodeInfo : nodeInfo
          }
        ];
      }
    );
  }

  private _handleEnterNodeDetails( nodeDetails : any, rows : any ) {
    nodeDetails.enter()
      .append( 'div' )
      .attr( this.ng2StyleAttr, '' )
      .classed( CLS.diagramNodeDetail, true );
  }

  private _handleUpdateNodeDetails( nodeDetails : any, rows : any ) {
    let diagram = this;
    let rowHeight = _getRowHeight( diagram.elm, CLS.diagramRow );

    nodeDetails = rows.selectAll( `.${CLS.diagramNodeDetail}` );

    nodeDetails.html( ( taskInfo : {
      name : string;
      desc : string;
      type : FLOGO_TASK_TYPE;
      taskStatus : {
        [key : string] : boolean;
        hasError : boolean;
        hasWarning : boolean;
      };
      nodeInfo : any;
    }, col : number, row : number ) => {

      if ( _.isEmpty( taskInfo ) ) {
        return '';
      }

      if ( taskInfo.nodeInfo.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
        let thisBranchRow = row;
        let level = 0;

        let thisBranchParent = <any>{
          id : taskInfo.nodeInfo.parents[ 0 ]
        };

        // TODO
        //  change to other Array API like some to optimise? but need to manually call d3 API to get the data..
        rows.each( function ( rowNodesIDs : string[], row:number ) {
          // if haven't got the level
          // try to find the parent node's row and get the diff of the rows as the level
          if (!level) {
            let parentCol = rowNodesIDs.indexOf(thisBranchParent.id);

            if (parentCol !== -1) {
              thisBranchParent.loc = {
                col: parentCol,
                row: row
              };

              level = thisBranchRow - row;
            }
          }
        } );

        let thisBranchLineHeight = rowHeight * level - 31;
        let branchLines = genBranchLine( { svgHeight : thisBranchLineHeight } );

        return _.map( [
          {
            class : CLS.diagramNodeDetailBranch,
            state : 'default'
          }, {
            class : CLS.diagramNodeDetailBranchHover,
            state : 'hover'
          }, {
            class : CLS.diagramNodeDetailBranchSelected,
            state : 'selected'
          }, {
            class : CLS.diagramNodeDetailBranchRun,
            state : 'run'
          }
        ], ( item : any )=> {
          let branchLine = btoa(
            branchLines[ item.state ].trim()
              .replace( /"/g, "'" )
              .replace( /\s+/g, ' ' ) );
          return `
              <div ${diagram.ng2StyleAttr} class="${item.class}">
                <div ${diagram.ng2StyleAttr} class="img-left" style="background:url(data:image/svg+xml;base64,${branchLine}) left bottom no-repeat; height: ${thisBranchLineHeight}px"></div>
                <div ${diagram.ng2StyleAttr} class="img-right" style="background:url(data:image/svg+xml;base64,${branchLine}) right bottom no-repeat;"></div>
              </div>
            `
        } )
          .join( '' );
      }

      if( taskInfo.nodeInfo.type ===  FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW ) {
        taskInfo = _.assign({}, taskInfo, {name: 'On Error', desc: 'Error ocurred', type: FLOGO_TASK_TYPE.TASK_ROOT});
      }

      if ( taskInfo.name && taskInfo.desc ) {
        let iconName = 'activity.icon.svg';

        if (taskInfo.type === FLOGO_TASK_TYPE.TASK_ROOT) {
          iconName = 'trigger.icon.svg';
        }

        return `<img ${diagram.ng2StyleAttr} class="${CLS.diagramNodeDetailIcon}" src="/assets/svg/flogo.flows.detail.diagram.${iconName}" alt=""/>
                <div ${diagram.ng2StyleAttr} class="${CLS.diagramNodeDetailTitle}" title="${taskInfo.name}">${taskInfo.name}</div>
                <div ${diagram.ng2StyleAttr} class="${CLS.diagramNodeDetailDesc}" title="${taskInfo.desc}">${taskInfo.desc}</div>`;
      } else {
        return ``;
      }

    } );
  }

  private _handleExitNodeDetails( nodeDetails : any, rows : any ) {
    nodeDetails.exit()
      .remove();
  }

  private _handleNodeDetails( nodeDetails : any, rows : any ) {

    this._handleEnterNodeDetails( nodeDetails, rows );
    this._handleUpdateNodeDetails( nodeDetails, rows );
    this._handleExitNodeDetails( nodeDetails, rows );

  }

  private _bindDataToNodeMenus( nodeMenus : any ) {
    return nodeMenus.data(
      ( nodeInfo : any )=> {
        if ( nodeInfo && _isNodeHasMenu( nodeInfo ) ) {
          return [ nodeInfo ];
        }

        return [];
      }
    );
  }

  private _handleEnterNodeMenus( nodeMenus : any ) {
    let newNodeMenus = nodeMenus.enter();

    newNodeMenus.append( 'div' )
      .attr( this.ng2StyleAttr, '' )
      .classed( CLS.diagramNodeMenu, true )
      .on( 'click', function ( nodeInfo : any, col : number, row : number ) {
        let event = <Event>d3.event;
        event.stopPropagation();

        if ( (
            <HTMLElement>event.target
          ).getAttribute( 'data-menu-item-type' ) ) {

          // fire event if it's menu item
          let evtType = 'flogoClickNodeMenuItem';

          _triggerCustomEvent( evtType, {
            origEvent : d3.event,
            node : nodeInfo
          }, this );
        }

        // comment out since hover will show the menu
        // else {
        //
        //   // fire menu on clicked event if this menu is clicked.
        //   let evtType = 'flogoClickNodeMenu';
        //
        //   _triggerCustomEvent( evtType, {
        //     origEvent : d3.event,
        //     node : nodeInfo
        //   }, this );
        // }
      } );
  }

  private _handleUpdateNodeMenus( nodeMenus : any ) {
    let diagram = this;
    let textAddBranch = this.translate.instant('DIAGRAM:ADD-BRANCH');
    let textTransform = this.translate.instant('DIAGRAM:TRANSFORM');
    let textDelete = this.translate.instant('DIAGRAM:DELETE');

    nodeMenus.html( ( nodeInfo : any, ignore : number, idxInTotalNodes : number ) => {
      let tplItemAddBranch = `<li ${diagram.ng2StyleAttr} class="${CLS.diagramNodeMenuList}" data-menu-item-type="${FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE.ADD_BRANCH}"><i ${diagram.ng2StyleAttr} class="fa fa-plus"></i>${textAddBranch}</li>`;

      let tplItemTransform = `<li ${diagram.ng2StyleAttr} class="${CLS.diagramNodeMenuList}" data-menu-item-type="${FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE.SELECT_TRANSFORM}"><i ${diagram.ng2StyleAttr} class="fa fa-bolt"></i>${textTransform}</li>`;

      let tplItemDelete = `<li ${diagram.ng2StyleAttr} class="${CLS.diagramNodeMenuList}" data-menu-item-type="${FLOGO_FLOW_DIAGRAM_NODE_MENU_ITEM_TYPE.DELETE}"><i ${diagram.ng2StyleAttr} class="fa fa-trash-o"></i>${textDelete}</li>`;

      let tplGear = `<span ${diagram.ng2StyleAttr} class="${CLS.diagramNodeMenuGear}"></span>`;

      // TODO
      //  enable the delete for trigger in the future
      if ( nodeInfo.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT ) {
        return ``;
      }

      if ( nodeInfo.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
        return `<ul ${diagram.ng2StyleAttr} class="${CLS.diagramNodeMenuBox}">
                    ${tplItemDelete}
                  </ul>${tplGear}`;
      }

      // if not the last node in row
      if ( (idxInTotalNodes + 1) % 7 ) {
        // normal template
        return `<ul ${diagram.ng2StyleAttr} class="${CLS.diagramNodeMenuBox}">
                    ${tplItemAddBranch}
                    ${tplItemTransform}
                    ${tplItemDelete}
                </ul>${tplGear}`;
      } else {
        // no add branch
        return `<ul ${diagram.ng2StyleAttr} class="${CLS.diagramNodeMenuBox}">
                    ${tplItemTransform}
                    ${tplItemDelete}
                </ul>${tplGear}`;
      }

    } );
  }

  private _handleExitNodeMenus( nodeMenus : any ) {
    let exitNodeMenus = nodeMenus.exit();
    exitNodeMenus.on( 'click', null )
      .remove();
  }

  private _handleNodeMenus( nodeMenus : any ) {

    this._handleEnterNodeMenus( nodeMenus );
    this._handleUpdateNodeMenus( nodeMenus );
    this._handleExitNodeMenus( nodeMenus );

  }

  private _bindDataToNodeBadges( nodeBadges : any ) {
    return nodeBadges.data(
      ( nodeInfo : any ) => {
        if ( nodeInfo ) {
          let task = this.tasks[ nodeInfo.taskID ];
          let taskStatus = _getTaskStatus( task );
          let errors = _.get( task, '__props.errors', [] );

          if ( task ) {
            return [
              {
                hasError : taskStatus.hasError,
                hasMapping : _isTaskHasMapping( task ),
                errors : errors
              }
            ]
          }
        }

        return [];
      }
    );
  }

  private _handleEnterNodeBadges( nodeBadges : any ) {
    nodeBadges.enter()
      .append( 'div' )
      .attr( this.ng2StyleAttr, '' )
      .classed( CLS.diagramNodeBadge, true );
  }

  private _handleUpdateNodeBadges( nodeBadges : any ) {
    let diagram = this;

    nodeBadges.html( ( taskStatus : any ) => {
        let tpl = '';

        if ( taskStatus ) {
          if ( taskStatus.hasError ) {
            let message = _.reduce( taskStatus.errors, ( result : string, error : {msg : string;time : string;} ) => {
              return `${result}[Error][${moment( error.time || new Date().toJSON() )
                .fromNow()
                }]: ${error.msg}\n`;
            }, '' );

            tpl += `<i ${diagram.ng2StyleAttr} class="flogo-flows-detail-diagram-status-icon flogo-flows-detail-diagram-ic-error" title="${message.trim()}"></i>`;
          }

          if ( taskStatus.hasMapping ) {
            tpl += `<i ${diagram.ng2StyleAttr} class="flogo-flows-detail-diagram-status-icon flogo-flows-detail-diagram-ic-transform"></i>`;
          }
        }

        return tpl;
      } );
  }

  private _handleExitNodeBadges( nodeBadges : any ) {
    nodeBadges.exit()
      .remove();
  }

  private _handleNodeBadges( nodeBadges : any ) {

    this._handleEnterNodeBadges( nodeBadges );
    this._handleUpdateNodeBadges( nodeBadges );
    this._handleExitNodeBadges( nodeBadges );

  }

  public render() : Promise < FlogoFlowDiagram > {
    DEBUG && console.group( 'rendering...' );

    this.rootElm = d3.select( this.elm )
      .select( `.${CLS.diagram}` );

    !this.ng2StyleAttr && this._updateNG2StyleAttr();

    this.nodesOfAddType = this.nodesOfAddType || <IFlogoFlowDiagramNodeDictionary>{};

    // enter selection
    let rows = this._bindDataToRows( this.rootElm.selectAll( `.${CLS.diagramRow}` ) );

    this._handleEnterRows( rows );
    this._handleUpdateRows( rows );
    this._handleExitRows( rows );

    DEBUG && console.groupEnd();

    return Promise.resolve( this );
  }

  public triggerByTaskID( eventName : string, taskID : string ) : Promise < FlogoFlowDiagram > {

    if ( !eventName || !taskID ) {
      return Promise.resolve( this );
    }

    let nodeID : string;

    for ( let nid in this.nodes ) {
      if ( this.nodes[ nid ].taskID === taskID ) {
        nodeID = nid;
        break;
      }
    }

    let node = this.nodes[ nodeID ];

    if ( !node ) {
      return Promise.resolve( this );
    }

    let diagram = this;

    let allNodes = d3.selectAll( `.${CLS.diagramNode}` );

    // find the node in diagram
    let nodeInDiagram : any;
    let prevNodeInDiagram : any;
    let nextNodeInDiagram : any;
    let doneFlag = false;

    allNodes.each( function ( nodeInfo : any, idx : number ) {

      // get the next node of the current node in the diagram
      if ( doneFlag ) {
        if ( nodeInDiagram && !nextNodeInDiagram ) {
          nextNodeInDiagram = d3.select( this );
        }
        return;
      }

      // get the given node in the diagram
      if ( nodeInfo.id === nodeID ) {
        doneFlag = true;
        nodeInDiagram = d3.select( this );
      } else {
        // record the previous node in the diagram
        prevNodeInDiagram = d3.select( this );
      }

      return;
    } );

    try {
      switch ( eventName ) {
        case 'addTask':

          (<any>$( nextNodeInDiagram[ 0 ][ 0 ] ))
            .trigger( 'click' );

          break;

        case 'selectTask':
        case 'selectTrigger':

          (<any>$( nodeInDiagram[ 0 ][ 0 ] ))
            .trigger( 'click' );

          break;

        default:

          (<any>$( nodeInDiagram[ 0 ][ 0 ] ))
            .trigger( eventName );

          break;
      }
    } catch ( e ) {
      console.error( e );
    }

    return Promise.resolve( this );
  }

  public linkNodeWithTask( nodeID : string, task : IFlogoFlowDiagramTask ) : Promise < FlogoFlowDiagram > {
    let node = this.nodes[ nodeID ] || this.nodesOfAddType[ nodeID ];

    if ( node ) {
      node.taskID = task.id;

      if ( node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD ) {
        this.nodes[ node.id ] = node;
        delete this.nodesOfAddType[ node.id ];

        node.type = FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE;

        let parentNode = this.nodes[ node.parents[ 0 ] ];

        (<FlogoFlowDiagramNode>parentNode).linkToChildren( [ node.id ] );

      } else if (node.type ===  FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW) {
        node.type = FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT;
      }
    } else {
      // use Promise.reject with error message cause TypeScript error
      // TODO
      //   change to Promise.reject sometime somehow.
      DEBUG && console.warn( 'Cannot find the node' );
    }

    return Promise.resolve( this );
  }

  public findNodesByType( type : FLOGO_FLOW_DIAGRAM_NODE_TYPE,
    sourceNodes ? : IFlogoFlowDiagramNode[ ] ) : IFlogoFlowDiagramNode[ ] {
    let nodes : IFlogoFlowDiagramNode[ ] = [];

    if ( sourceNodes ) {
      _.each(
        sourceNodes, ( node ) => {
          if ( node.type === type ) {
            nodes.push( node );
          }
        }
      );
    } else {
      _.mapKeys(
        this.nodes, ( node ) => {
          if ( node.type === type ) {
            nodes.push( node );
          }
        }
      );
    }

    return nodes;
  }

  public findNodesByIDs( ids : string[ ] ) : IFlogoFlowDiagramNode[ ] {
    let nodes : IFlogoFlowDiagramNode[ ] = [];

    _.each(
      ids, ( id ) => {
        let node = this.nodes[ id ];

        node && nodes.push( node );
      }
    );

    return nodes;
  }

  public findChildrenNodesByType( type : FLOGO_FLOW_DIAGRAM_NODE_TYPE,
    node : IFlogoFlowDiagramNode ) : IFlogoFlowDiagramNode[ ] {
    return this.findNodesByType( type, this.findNodesByIDs( node.children ) );
  }

  public findParentsNodesByType( type : FLOGO_FLOW_DIAGRAM_NODE_TYPE,
    node : IFlogoFlowDiagramNode ) : IFlogoFlowDiagramNode[ ] {
    return this.findNodesByType( type, this.findNodesByIDs( node.parents ) );
  }

  public deleteNode( node : IFlogoFlowDiagramNode ) : Promise<any> {
    let deleteNode = <FlogoFlowDiagramNode>this.nodes[ node.id ];

    if ( deleteNode ) {
      _deleteNode( deleteNode, this.nodes );
    } else {
      return Promise.reject( `Node ${node.id} doesn't exists.` );
    }

    return Promise.resolve( this );
  }

  public addBranch( parentNode : IFlogoFlowDiagramNode, branchInfo : any ) : Promise<any> {
    // the `node` is the parent node of the branch
    // the `task` is the branch information

    let node = new FlogoFlowDiagramNode( {
      id : FlogoFlowDiagramNode.genNodeID(),
      type : FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH,
      taskID : branchInfo.id,
      parents : [ parentNode.id ],
      children : []
    } );

    this.nodes[ node.id ] = node;

    (<FlogoFlowDiagramNode>this.nodes[ parentNode.id ]).linkToChildren( [ node.id ] );

    return Promise.resolve( this );
  }

  private _updateNG2StyleAttr() {
    let el = this.elm.getElementsByClassName( CLS.diagram );
    let ng2StyleAttrReg = /^_ngcontent\-.*$/g;

    if ( el && el.length ) {
      Array.prototype.some.call(
        el[ 0 ].attributes, ( attr : any ) => {

          if ( ng2StyleAttrReg.test( attr.name ) ) {
            this.ng2StyleAttr = attr.name;

            return true;
          }

          return false;
        }
      );

      return true;
    }

    return false;
  }

}

// helper function of transformMatrix function
//   if the item has multiple children, put the first non-branch node along with the item
//   create new row the the rest of the branch nodes
// TODO
//   at some time, may need to track which node has been visited
//   for example branch back to other path
//   but for now, may not need to care about it
function _insertChildNodes( matrix : string[ ][ ],
  diagram : IFlogoFlowDiagram,
  node : IFlogoFlowDiagramNode ) : string[ ][ ] {

  // deep-first traversal

  let curRowIdx = matrix.length - 1;

  if ( node.children.length ) {
    // make sure the non-branch/non-link node is the first children of the node
    node.children.sort( ( nodeAID : string, nodeBID : string )=> {
      if ( diagram.nodes[ nodeAID ].type === diagram.nodes[ nodeBID ].type ) {
        return 0;
      } else if ( diagram.nodes[ nodeAID ].type
        === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH
        || diagram.nodes[ nodeAID ].type
        === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_LINK ) {
        return 1;
      } else {
        return -1;
      }
    } );

    _.each( node.children, ( nodeID : string ) => {
      if ( diagram.nodes[ nodeID ].type !== FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
        // push to the current row if it's non-branch node
        matrix[ curRowIdx ].push( nodeID );
      } else {
        // create new row for branch node
        let newRow = Array( matrix[ curRowIdx ].indexOf( node.id ) );
        newRow.push( nodeID );
        matrix.push( newRow );
      }

      // not follow the children of a link node
      if ( diagram.nodes[ nodeID ].type !== FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_LINK ) {
        _insertChildNodes( matrix, diagram, diagram.nodes[ nodeID ] );
      }

    } );
  }

  return matrix;
}

function _triggerCustomEvent( eventType : string, eventDetail : any, elm : HTMLElement ) : boolean {

  // trigger specific events
  if ( CustomEvent && elm.dispatchEvent ) {
    if ( eventType ) {
      let evtDetail = {
        'view' : window,
        'bubbles' : true,
        'cancelable' : true,
        'cancelBubble' : true,
        'detail' : eventDetail
      };

      elm.dispatchEvent( new CustomEvent( eventType, evtDetail ) );

      return true;
    } else {
      DEBUG && console.warn( 'No eventType is given.' );
      return false;
    }
  } else {
    DEBUG && console.warn( 'Unsupport CustomEvent or dispatchEvent' );
    return false;
  }

}

function _getTaskStatus( task : any ) {
  let _errors = _.get( task, '__props.errors', [] );
  let _warnings = _.get( task, '__props.warnings', [] );

  let taskStatus : {
    [key : string] : boolean;
    hasError : boolean;
    hasWarning : boolean;
  } = {
    hasError : !_.isEmpty( _errors ),
    hasWarning : !_.isEmpty( _warnings )
  };

  _.forIn( _.get( task, '__status', {} ), ( val : boolean, statusName : string ) => {
    taskStatus[ statusName ] = val;
  } );

  return taskStatus;
}

function _isNodeHasDetails( nodeInfo : any ) : boolean {
  if ( nodeInfo.type ) {
    return [
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_HOLDER,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW
      ].indexOf( nodeInfo.type ) === -1;
  } else {
    return false;
  }
}

function _isNodeHasMenu( nodeInfo : any ) : boolean {
  if ( nodeInfo.type ) {
    return [
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_NEW,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_HOLDER,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW
      ].indexOf( nodeInfo.type ) === -1;
  } else {
    return false;
  }
}

function _isNodeSelectable(nodeInfo: IFlogoFlowDiagramNode) {
  if ( nodeInfo.type ) {
    return [
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_HOLDER,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_PADDING,
        FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ROOT_ERROR_NEW
      ].indexOf( nodeInfo.type ) === -1;
  } else {
    return false;
  }
}

function _isTaskHasMapping( taskInfo : any ) : boolean {
  return taskInfo && (
      (
        _.isArray( taskInfo.inputMappings ) && taskInfo.inputMappings.length > 0
      )
      // TODO: re-enable outputMappings verification after its editing is enabled
      // || (
      //  _.isArray( taskInfo.outputMappings ) && taskInfo.outputMappings.length > 0
      // )
    )
}

function _getRowHeight( elm : HTMLElement, rowClassName : string ) : number {
  let rowElm = elm.querySelector( `.${rowClassName}` );
  let clientRect = rowElm.getBoundingClientRect();

  return clientRect.height;
}

/**
 * Utility functions to delete nodes
 */
function _isInSingleRow( node : IFlogoFlowDiagramNode ) {
  return (node.parents.length === 1 && node.children.length < 2);
}

function _isBranchNode( node : IFlogoFlowDiagramNode ) {
  return node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH;
}

function _hasTaskRun( node : IFlogoFlowDiagramNode, tasks : IFlogoFlowDiagramTaskDictionary ) : boolean {
  if ( !node || !tasks ) {
    return false;
  }

  const task = tasks[ node.taskID ];

  if ( !task ) {
    return false;
  }

  return _.get( task, '__status.hasRun', false );
}

function _hasBranchRun( node : IFlogoFlowDiagramNode,
  tasks : IFlogoFlowDiagramTaskDictionary,
  nodes : IFlogoFlowDiagramNodeDictionary ) : boolean {

  if ( !node || !tasks || !nodes || !_isBranchNode( node ) ) {
    return false;
  }

  const parents = _.get( node, 'parents', [] );
  const children = _.get( node, 'children', [] );

  // when no parent or no child, then the branch shouldn't been run
  if ( !parents.length || !children.length ) {
    return false;
  }

  // if any of the parents and any of the children have run
  // then the branch should be marked as run
  return _.some( parents, ( parent ) => _hasTaskRun( nodes[ parent ], tasks ) ) && _.some( children,
      ( child ) => _hasTaskRun( nodes[ child ], tasks ) );

}

function _removeNodeInSingleRow( node : FlogoFlowDiagramNode, nodes : IFlogoFlowDiagramNodeDictionary ) {
  VERBOSE && console.group( `_removeNodeInSingleRow: ${node.id}` );

  let itsParent = nodes[ node.parents[ 0 ] ];
  let itsChild = nodes[ node.children[ 0 ] ];

  if ( itsChild ) {

    if ( itsChild.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
      _removeBranchNode( <FlogoFlowDiagramNode>itsChild, nodes );
      itsParent.children.splice( itsParent.children.indexOf( node.id ), 1 );
    } else {
      itsChild.parents.splice( itsChild.parents.indexOf( node.id ), 1, itsParent.id );
      itsParent.children.splice( itsParent.children.indexOf( node.id ), 1, itsChild.id );
    }

  } else {
    itsParent.children.splice( itsParent.children.indexOf( node.id ), 1 );
  }

  delete nodes[ node.id ];
  VERBOSE && console.groupEnd();
}

function _removeNodeHasChildren( node : FlogoFlowDiagramNode, nodes : IFlogoFlowDiagramNodeDictionary ) {
  VERBOSE && console.group( `_removeNodeHasChildren: ${node.id}` );

  // TODO
  //  note that the node has single non-branch child at the time of implement this logic.
  //  if that assumption is changed, then need to refine this logic.
  if ( node.children.length > 1 ) {
    // remove all of the branch type children;
    node.children = _.filter( _.clone( node.children ), ( childNodeID : string ) => {
      let childNode = <FlogoFlowDiagramNode>nodes[ childNodeID ];
      if ( childNode && childNode.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {
        _deleteNode( childNode, nodes );
        return false;
      }

      return true;
    } );
  }

  VERBOSE && console.log( _.cloneDeep( node ) );

  // remove self;
  _deleteNode( node, nodes );
  VERBOSE && console.groupEnd();
}

function _removeBranchNode( node : FlogoFlowDiagramNode, nodes : IFlogoFlowDiagramNodeDictionary ) {
  VERBOSE && console.group( `_removeBranchNode: ${node.id}` );

  if ( node.children.length > 0 ) {
    _recursivelyDeleteNodes( <FlogoFlowDiagramNode>nodes[ node.children[ 0 ] ], nodes );
  }

  _removeNodeInSingleRow( node, nodes );
  VERBOSE && console.groupEnd();
}

// could be used to recursively delete nodes
function _deleteNode( node : FlogoFlowDiagramNode, nodes : IFlogoFlowDiagramNodeDictionary ) {
  VERBOSE && console.group( `_deleteNode: ${node.id}` );
  VERBOSE && console.log( _.cloneDeep( node ) );

  if ( node && nodes ) {
    if ( node.children.length > 1 ) {

      _removeNodeHasChildren( node, nodes );

    } else if ( node.type === FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_BRANCH ) {

      _removeBranchNode( node, nodes );

    } else if ( _isInSingleRow( node ) ) {

      _removeNodeInSingleRow( node, nodes );

    } else {
      // TODO
      //  support linking cases
      DEBUG && console.warn( 'Unsupported case..' );
    }
  }
  VERBOSE && console.groupEnd();
}

function _recursivelyDeleteNodes( node : FlogoFlowDiagramNode, nodes : IFlogoFlowDiagramNodeDictionary ) {
  VERBOSE && console.group( `_recursivelyDeleteNodes: ${node.id}` );

  if ( node.children.length > 0 ) {
    _.each( _.clone( node.children ), ( childNodeID : string ) => {
      let childNode = <FlogoFlowDiagramNode>nodes[ childNodeID ];

      if ( childNode ) {
        _recursivelyDeleteNodes( childNode, nodes );
      }
    } );
  }

  _deleteNode( node, nodes );

  VERBOSE && console.groupEnd();
}
