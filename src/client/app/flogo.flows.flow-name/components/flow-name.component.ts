import {Component, ViewChild, SimpleChange, OnChanges, EventEmitter, Input, Output} from '@angular/core';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import { notification } from '../../../common/utils';

@Component({
    selector: 'flogo-flows-flow-name',
    moduleId: module.id,
    templateUrl: 'flow-name.tpl.html',
    styleUrls: ['flow-name.component.css']
})
export class FlogoFlowsFlowNameComponent implements OnChanges {
    @Input()
    show:boolean = false;
    @Input()
    repeatedName:string='';
    @Output()
    correctName: EventEmitter<any> = new EventEmitter();
    @Output()
    close: EventEmitter<any> = new EventEmitter();
    public flowName: string;
    public flowNameExists = true;
    public nameModified = false;

    constructor(public translate: TranslateService, public APIFlows: RESTAPIFlowsService) {
    }

    @ViewChild('flowNameModal')
        flowNameModal: ModalComponent;

    public sendAddFlowMsg() {
        this.APIFlows.findFlowsByName(this.repeatedName)
            .then((results) => {
                if(!_.isEmpty(results)) {
                    this.flowNameExists = true;
                    this.nameModified = false;
                } else {
                    this.correctName.emit(this.repeatedName);
                    this.closeModal();
                }
            })
            .catch((err) => {
                let message = this.translate.instant('FLOW-NAME:GETTING-FLOW-NAME');
                notification(message, 'error');
            });



    }

    public closeModal() {
        this.repeatedName = '';
        this.flowNameModal.close();
        this.close.emit(true);
    }

    ngOnChanges( changes : {
        [key : string] : SimpleChange
    } ) {

        if(_.has(changes, 'show')) {
            if(changes['show'].currentValue == true) {
                this.flowNameExists = true;
                this.nameModified = false;
                this.flowNameModal.open()
            }
        }

        if(_.has(changes, 'repeatedName')) {
            if(changes['repeatedName'].currentValue) {
                this.repeatedName = changes['repeatedName'].currentValue;
            }
        }

    }

    public onChangeFlowName(event) {
        this.flowNameExists = false;
        this.nameModified = true;
    }

}
