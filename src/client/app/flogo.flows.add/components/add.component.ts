import { Component, ViewChild } from '@angular/core';
import {PostService} from '../../../common/services/post.service';
import {PUB_EVENTS} from '../message';
import {MODAL_DIRECTIVES, ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';

@Component({
    selector: 'flogo-flows-add',
    moduleId: module.id,
    templateUrl: 'add.tpl.html',
    styleUrls: ['add.component.css'],
    directives: [MODAL_DIRECTIVES]
})
export class FlogoFlowsAdd {
    public flowName: string;
    public flowDescription: string;

    private flowInfo : any = {};
    private _sending = true;

    constructor(private _postService: PostService) {
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
    private closeAddFlowModal() {
        this.flowInfo = {};
        this.modal.close();
        this._sending = true;
    }
}
