import {Component} from '@angular/core';
import { MODAL_DIRECTIVES } from 'ng2-bs3-modal/ng2-bs3-modal';

import {PUB_EVENTS, SUB_EVENTS} from '../../flogo.flows.detail.triggers/messages';

import {RESTAPIService} from "../../../common/services/rest-api.service";
import {PostService} from "../../../common/services/post.service";

import {TRIGGERS as MOCK_TRIGGERS} from "../../flogo.flows.detail.triggers/mocks/triggers"

@Component({
  selector: 'flogo-flows-detail-triggers-install',
  directives: [MODAL_DIRECTIVES],
  moduleId: module.id,
  templateUrl: 'install.tpl.html',
})
export class FlogoFlowsDetailTriggersInstallComponent {

  public triggers:any[] = [];

  constructor(private _restApiService:RESTAPIService, private _postService:PostService) {
    this.triggers = MOCK_TRIGGERS;
    //this._loadTriggers();
  }

  public install(trigger:any) {

    this._restApiService.triggers
      .install([{
        name: trigger.name,
        version: trigger.version
      }])
      .then(() => {
        this._loadTriggers();
        this._postService.publish(
          _.assign(
            {}, SUB_EVENTS.installTrigger, {
              data: {}
            }
          )
        );


      });

  }

  private _loadTriggers() {
    this._restApiService.triggers.getAll()
      .then((triggers:any) => this.triggers = triggers);
  };

}
