import {Component} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router} from 'angular2/router';
import {RESTAPIFlowsService} from '../../../common/services/restapi/flows-api.service';
import {RESTAPIActivitiesService} from '../../../common/services/restapi/activities-api.service';
import {RESTAPITriggersService} from '../../../common/services/restapi/triggers-api.service';
import { flogoIDEncode , notification } from '../../../common/utils';
import {FlogoFlowsAdd} from '../../flogo.flows.add/components/add.component';

import {PostService} from '../../../common/services/post.service'
import {PUB_EVENTS as SUB_EVENTS} from '../../flogo.flows.add/message';
import {FlogoModal} from '../../../common/services/modal.service';
import { FlogoFlowsImport } from '../../flogo.flows.import/components/import-flow.component';

@Component({
  selector: 'flogo-flows',
  moduleId: module.id,
  templateUrl: 'flows.tpl.html',
  styleUrls: ['flows.component.css'],
  directives: [ROUTER_DIRECTIVES, FlogoFlowsAdd, FlogoFlowsImport],
  providers: [RESTAPIFlowsService, RESTAPIActivitiesService, RESTAPITriggersService, FlogoModal]
})

export class FlogoFlowsComponet{
    private _sub: any;
    public flows: any[] = [];

    constructor(
        private _flow:RESTAPIFlowsService,
        private _postService: PostService,
        private _flogoModal: FlogoModal,
        private _router: Router,
    ){
        this.getAllFlows();
        this.initSubscribe();
    }
    private initSubscribe() {
        this._sub = this._postService.subscribe(_.assign({}, SUB_EVENTS.addFlow, {
            callback: this._addFlowMsg.bind(this)
        }));
    }
    ngOnDestroy() {
        this._postService.unsubscribe(this._sub);
    }

    // create a new flow
    private _addFlowMsg(data: any) {
        new Promise((resolve, reject)=>{
            let request = {
                name: data.name,
                description: data.description,
                paths: {},
                items: {}
            };
            this._flow.createFlow(_.clone(request)).then((response)=>{
                notification('Flow was created successfully!', 'success', 3000);
                resolve(response);
            }).catch((err)=>{
                notification(`Create flow error: ${err}`, 'error');
                reject(err);
            });
        }).then(()=>{
                return this.getAllFlows();
            }).catch((err)=>{
                console.error(err);
            });
    }

  openFlow( flowId : string, evt : Event ) {

    if ( _.isFunction( _.get( evt, 'stopPropagation' ) ) ) {
      evt.stopPropagation();
    }

    this._router.navigate( [
      'FlogoFlowDetail',
      { id : flogoIDEncode( flowId ) }
    ] )
      .catch( ( err : any )=> {
        console.error( err );
      } );
  }

    // delete a flow
    deleteFlow( flow: any, evt: Event) {

        if ( _.isFunction( _.get( evt, 'stopPropagation' ) ) ) {
          evt.stopPropagation();
        }

        this._flogoModal.confirmDelete('Are you sure you want to delete ' + flow.name + ' flow?').then((res) => {
            if(res) {
                this._flow.deleteFlow(flow._id, flow._rev).then(()=> {
                    this.getAllFlows();
                    notification('Flow was deleted successfully!', 'success', 3000);
                }).catch((err)=> {
                    notification(`Remove flow error: ${err}`, 'error');
                });
            } else {
                // omit
            }
        });
    }
    getAllFlows(){
        return new Promise((resolve, reject)=>{
            this._flow.getFlows().then((response)=>{
                if(typeof response !== 'object'){
                    response = JSON.parse(response);
                }
                response.reverse();
                this.flows = response;
                this.flows.forEach((flow) => {
                    let time = new Date(flow.created_at);
                    time = new Date(time.getTime());
                    time = ''+time.getFullYear()+this._toDouble(time.getMonth()+1)+this._toDouble(time.getDate())+' '+ this._toDouble(time.getHours())+':'+this._toDouble(time.getMinutes())+':'+this._toDouble(time.getSeconds());
                    flow.created_at = moment(time, 'YYYYMMDD hh:mm:ss').fromNow();
                });
                resolve(response);
            }).catch((err)=>{
                reject(err);
            })
        })
    }

  onFlowImportSuccess( result : any ) {
    notification( `Import flow successfully!`, 'success', 3000 );
    this.getAllFlows();
  }

  onFlowImportError( err : {
    status : string;
    statusText : string;
    response : any
  } ) {
    notification( `${err.response}`, 'error' );
  }


    // export flogoIDEncode
    // mainly for Route Link
    flogoIDEncode( id ) {
        return flogoIDEncode( id );
    }
    private _toDouble(num) {
        return num > 9? num: '0' + num;
    }
}
