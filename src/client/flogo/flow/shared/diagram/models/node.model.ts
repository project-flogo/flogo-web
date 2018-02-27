import { flogoIDEncode } from '@flogo/shared/utils';
// import { FlowDiagram } from './diagram.model';
import { FLOGO_FLOW_DIAGRAM_NODE_TYPE, FLOGO_FLOW_DIAGRAM_VERBOSE as VERBOSE } from '../constants';
import { Node } from '@flogo/core/interfaces/flow-diagram/node';

export class FlogoFlowDiagramNode implements Node {
  static count = 1;

  id: string; // id of the node
  taskID: string; // id of the task
  type: FLOGO_FLOW_DIAGRAM_NODE_TYPE; // type of the node
  children: string[ ]; // ids of the children Node
  parents: string[ ]; // ids of the parents Node
  // subProc: FlowDiagram[ ]; // [optional] sub process diagram of a task with sub process

  static genNodeID(): string {
    const id = `FlogoFlowDiagramNode::${Date.now()}::${FlogoFlowDiagramNode.count++}`;
    return flogoIDEncode(id);
  }

  static resetCount() {
    FlogoFlowDiagramNode.count = 1;
  }

  constructor(node ?: Node) {
    if (!node) {
      node = {
        id: FlogoFlowDiagramNode.genNodeID(),
        taskID: '',
        type: FLOGO_FLOW_DIAGRAM_NODE_TYPE.NODE_ADD,
        children: [],
        parents: []
      };
    }

    this.update(node);
  }

  public update(node: Node): Promise<FlogoFlowDiagramNode> {

    this.id = node.id;
    this.taskID = node.taskID;
    this.type = node.type;
    this.children = _.cloneDeep(node.children);
    this.parents = _.cloneDeep(node.parents);
    // this.subProc = _.cloneDeep(node.subProc);

    return Promise.resolve(this);
  }

  public hasNoChild() {
    return !this.children.length;
  }

  public hasNoParent() {
    return !this.parents.length;
  }

  public linkTo(nodes: {
    parents ?: string[ ],
    children ?: string[ ]
  }): Promise<any> {
    const promises: Promise<boolean> [ ] = [];

    if (nodes.children) {
      promises.push(this.linkToChildren(nodes.children));
    }

    if (nodes.parents) {
      promises.push(this.linkToParents(nodes.parents));
    }

    return Promise.all(promises);
  }

  public linkToChildren(nodeIDs: string[ ]): Promise<boolean> {
    this.children = _.union(this.children, nodeIDs);

    /* tslint:disable:no-unused-expression */
    VERBOSE && console.groupCollapsed(this.id + ' linkToChildren');
    VERBOSE && console.log(this);
    VERBOSE && console.log(this.children);
    VERBOSE && console.groupEnd();
    /* tslint:enable:no-unused-expression */

    return Promise.resolve(true);
  }

  public linkToParents(nodeIDs: string[ ]): Promise<boolean> {
    this.parents = _.union(this.parents, nodeIDs);

    /* tslint:disable:no-unused-expression */
    VERBOSE && console.groupCollapsed(this.id + ' linkToParents');
    VERBOSE && console.log(this);
    VERBOSE && console.log(this.parents);
    VERBOSE && console.groupEnd();
    /* tslint:enable:no-unused-expression */

    return Promise.resolve(true);
  }

  public unlinkFrom(nodes: {
    parents ?: string[ ],
    children ?: string[ ]
  }): Promise<any> {
    const promises: Promise<boolean>[] = [];

    if (nodes.children) {
      promises.push(this.unlinkFromChildren(nodes.children));
    }

    if (nodes.parents) {
      promises.push(this.unlinkFromParents(nodes.parents));
    }

    return Promise.all(promises);
  }

  public unlinkFromChildren(nodeIDs: string[ ]): Promise<boolean> {
    const removed = _.remove(
      this.children, (nodeID) => {
        return nodeIDs.indexOf(nodeID) !== -1;
      }
    );

    /* tslint:disable:no-unused-expression */
    VERBOSE && console.groupCollapsed(this.id + ' unlinkFromChildren');
    VERBOSE && console.log(this);
    VERBOSE && console.log(removed);
    VERBOSE && console.groupEnd();
    /* tslint:enable:no-unused-expression */

    return Promise.resolve(true);
  }

  public unlinkFromParents(nodeIDs: string[ ]): Promise<boolean> {
    const removed = _.remove(
      this.parents, (nodeID) => {
        return nodeIDs.indexOf(nodeID) !== -1;
      }
    );

    /* tslint:disable:no-unused-expression */
    VERBOSE && console.groupCollapsed(this.id + ' unlinkFromParents');
    VERBOSE && console.log(this);
    VERBOSE && console.log(removed);
    VERBOSE && console.groupEnd();
    /* tslint:enable:no-unused-expression */

    return Promise.resolve(true);
  }

}
