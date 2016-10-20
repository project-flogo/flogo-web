import { Component, ViewChild } from '@angular/core';
import { PostService } from '../../../common/services/post.service';
import { PUB_EVENTS } from '../message';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
    selector: 'flogo-flows-add',
    moduleId: module.id,
    templateUrl: 'add.tpl.html',
    styleUrls: ['add.component.css']
})
export class FlogoFlowsAdd {
    public flowName: string;
    public flowDescription: string;

    public flowInfo : any = {};
    private _sending = true;

    constructor(private _postService: PostService, public translate: TranslateService) {
    }

    @ViewChild('modal')
        modal: ModalComponent;

    public sendAddFlowMsg() {
        if (this._sending) {
            this._sending = false;
            this._postService.publish(
                _.assign({}, PUB_EVENTS.addFlow, {data: this.flowInfo})
            );
            this.closeAddFlowModal();
        } else {
            // omit
        }
    }
    public closeAddFlowModal() {
        this.flowInfo = {};
        this.modal.close();
        this._sending = true;
    }
}
