import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {Observable} from 'rxjs/Observable';

import {RESTAPIFlowsService} from '../../../common/services/restapi/flows-api.service';
import {flogoIDEncode , notification} from '../../../common/utils';

import {PostService} from '../../../common/services/post.service'
import {PUB_EVENTS as SUB_EVENTS} from '../../flogo.flows.add/message';
import {FlogoModal} from '../../../common/services/modal.service';
import {LoadingStatusService} from "../../../common/services/loading-status.service";
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
  selector: 'flogo-flows',
  moduleId: module.id,
  templateUrl: 'flows.tpl.html',
  styleUrls: ['flows.component.css']
 })
export class FlogoFlowsComponent {
    private _sub: any;
    public flows: any[] = [];
    public isInstructionsActivated:boolean  = false;
    public isLoading : Observable<boolean>

    constructor(
        private _flow:RESTAPIFlowsService,
        private _postService: PostService,
        private _flogoModal: FlogoModal,
        private _router: Router,
        private _loadingStatusService : LoadingStatusService,
        public translate: TranslateService
    ){
        this.getAllFlows();
        this.initSubscribe();
        setTimeout(() => {
           this.showInstructions();
       },500);

      this.isLoading = _loadingStatusService.status;

    }

    public showInstructions() {
       let instructions:any = localStorage.getItem('flogo-show-instructions');

       if(_.isEmpty(instructions)) {
           localStorage.setItem('flogo-show-instructions', new Date().toString());
           this.isInstructionsActivated = true;
       }

       return this.isInstructionsActivated;
   }

   public onClosedInstructions(closed) {
       this.isInstructionsActivated = false;
   }

   public activateInstructions() {
       this.isInstructionsActivated = true;
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
                let message = this.translate.instant('FLOWS:SUCCESS-MESSAGE-FLOW-CREATED');
                notification(message, 'success', 3000);
                resolve(response);
            }).catch((err)=>{
                let message = this.translate.instant('FLOWS:CREATE_FLOW_ERROR', err);
                notification(message, 'error');
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

    this._loadingStatusService.start();
    this._router.navigate( [ '/flows', flogoIDEncode(flowId) ] )
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
                    let message = this.translate.instant('FLOWS:SUCCESS-MESSAGE-FLOW-DELETED');
                    notification(message, 'success', 3000);
                }).catch((err)=> {
                    let message = this.translate.instant('FLOWS:ERROR-MESSAGE-REMOVE-FLOW', {value:err});
                    notification(message, 'error');
                });
            } else {
                // omit
            }
        });
    }
    getAllFlows(){
        return new Promise((resolve, reject)=>{
            this._flow.getFlows().then((response:any)=>{
                if(typeof response !== 'object'){
                    response = JSON.parse(response);
                }
                response.reverse();
                this.flows = response;
                this.flows.forEach((flow) => {
                    let time = new Date(flow.created_at);
                    time = new Date(time.getTime());
                    let timeStr = ''+time.getFullYear()+this._toDouble(time.getMonth()+1)+this._toDouble(time.getDate())+' '+ this._toDouble(time.getHours())+':'+this._toDouble(time.getMinutes())+':'+this._toDouble(time.getSeconds());
                    flow.created_at = moment(timeStr, 'YYYYMMDD hh:mm:ss').fromNow();
                });
                resolve(response);
            }).catch((err)=>{
                reject(err);
            })
        })
    }

  onFlowImportSuccess( result : any ) {
      let message = this.translate.instant('FLOWS:SUCCESS-MESSAGE-IMPORT');
      notification( message, 'success', 3000 );
      this.getAllFlows();
  }

  onFlowImportError( err : {
    status : string;
    statusText : string;
    response : any
  } ) {
   let message = this.translate.instant('FLOWS:ERROR-MESSAGE-IMPORT', {value: err.response});
    notification( message, 'error' );
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
