import {Component, Input} from '@angular/core';
import {ROUTER_DIRECTIVES, Router, CanActivate} from '@angular/router-deprecated';

import {RESTAPIFlowsService} from '../../../common/services/restapi/flows-api.service';
import {flogoIDEncode, notification} from '../../../common/utils';
import {FlogoModal} from '../../../common/services/modal.service';
import {TranslatePipe, TranslateService} from 'ng2-translate/ng2-translate';

@Component({
  selector: 'flow-list',
  moduleId: module.id,
  templateUrl: 'flow-list.tpl.html',
  styleUrls: ['flow-list.component.css'],
  directives: [ROUTER_DIRECTIVES],
  pipes: [TranslatePipe],
  providers: [FlogoModal, RESTAPIFlowsService]
})

export class FlogoListComponent {
  @Input() public flows: any;

  constructor(private _flogoModal: FlogoModal,
              private _router: Router,
              private _flow: RESTAPIFlowsService,
              public translate: TranslateService) {
  }

  openFlow(flowId: string, evt: Event) {

    if (_.isFunction(_.get(evt, 'stopPropagation'))) {
      evt.stopPropagation();
    }

    this._router.navigate([
      'FlogoFlowDetail',
      {id: flogoIDEncode(flowId)}
    ])
      .catch((err: any) => {
        console.error(err);
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

  // delete a flow
  deleteFlow(flow: any, evt: Event) {

    if (_.isFunction(_.get(evt, 'stopPropagation'))) {
      evt.stopPropagation();
    }

    this._flogoModal.confirmDelete('Are you sure you want to delete ' + flow.name + ' flow?').then((res) => {
      if (res) {
        this._flow.deleteFlow(flow._id).then(() => {
          this.getAllFlows();
          let message = this.translate.get('FLOWS:SUCCESS-MESSAGE-FLOW-DELETED');
          notification(message['value'], 'success', 3000);
        }).catch((err) => {
          let message = this.translate.get('FLOWS:ERROR-MESSAGE-REMOVE-FLOW', {value: err});
          notification(message['value'], 'error');
        });
      } else {
        // omit
      }
    });
  }

  flogoIDEncode(id) {
    return flogoIDEncode(id);
  }

  private _toDouble(num) {
    return num > 9? num: '0' + num;
  }
}
