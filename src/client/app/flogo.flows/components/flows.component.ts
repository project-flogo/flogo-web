import {Component, Injector, ViewChild, ElementRef, Renderer, OnInit} from '@angular/core';
import {ROUTER_DIRECTIVES, Router, CanActivate} from '@angular/router-deprecated';

//import * as moment from 'moment';

import {RESTAPIFlowsService} from '../../../common/services/restapi/flows-api.service';
import {RESTAPIActivitiesService} from '../../../common/services/restapi/activities-api.service';
import {RESTAPITriggersService} from '../../../common/services/restapi/triggers-api.service';
import { notification } from '../../../common/utils';
import {FlogoFlowsAdd} from '../../flogo.flows.add/components/add.component';
import {FlogoFooter} from '../../flogo.footer/components/footer.component';
import {FlogoListComponent} from '../../flogo.flows.list/components/flow-list.component';

import {PostService} from '../../../common/services/post.service'
import {PUB_EVENTS as SUB_EVENTS} from '../../flogo.flows.add/message';
import { FlogoFlowsImport } from '../../flogo.flows.import/components/import-flow.component';
import { isConfigurationLoaded } from '../../../common/services/configurationLoaded.service';
import { TranslatePipe, TranslateService } from 'ng2-translate/ng2-translate';
import { IFlogoApplicationModel } from '../../../common/application.model';

@Component({
  selector: 'flogo-flows',
  moduleId: module.id,
  templateUrl: 'flows.tpl.html',
  styleUrls: ['flows.component.css'],
  directives: [ROUTER_DIRECTIVES, FlogoFlowsAdd, FlogoFlowsImport, FlogoFooter, FlogoListComponent ],
  pipes: [TranslatePipe],
  providers: [RESTAPIFlowsService, RESTAPIActivitiesService, RESTAPITriggersService]
})
@CanActivate((next) => {
    return isConfigurationLoaded();
})
export class FlogoFlowsComponet implements OnInit {
    private _sub: any;
    public flows: any[] = [];
    public samples: any;

    ngOnInit() {
    }

    constructor(
        private _flow:RESTAPIFlowsService,
        private _postService: PostService,
        public translate: TranslateService,
        public renderer: Renderer
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
                let message = this.translate.get('FLOWS:SUCCESS-MESSAGE-FLOW-CREATED');
                notification(message['value'], 'success', 3000);
                resolve(response);
            }).catch((err)=>{
                let message = this.translate.get('FLOWS:CREATE_FLOW_ERROR', err);
                notification(message['value'], 'error');
                reject(err);
            });
        }).then(()=>{
                return this.getAllFlows();
            }).catch((err)=>{
                console.error(err);
            });
    }

    canInstallSamples() {
        return !this.flows.length;
    }

    onInstallationIsDone() {
        this.getAllFlows();
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
      let message = this.translate.get('FLOWS:SUCCESS-MESSAGE-IMPORT');
      notification( message['value'], 'success', 3000 );
      this.getAllFlows();
  }

  onFlowImportError( err : {
    status : string;
    statusText : string;
    response : any
  } ) {
   let message = this.translate.get('FLOWS:ERROR-MESSAGE-IMPORT', {value: err.response});
    notification( message['value'], 'error' );
  }


    // export flogoIDEncode
    // mainly for Route Link

    private _toDouble(num) {
        return num > 9? num: '0' + num;
    }
}
