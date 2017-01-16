import { Component, Input, SimpleChange, OnChanges , ViewChild, ElementRef, EventEmitter } from '@angular/core';

import { TranslateService } from 'ng2-translate/ng2-translate';

import { IFlogoApplicationModel, IFlogoApplicationFlowModel } from '../../../common/application.model';
import { getDiffSecondBetweenDates } from '../../../common/utils';

const MAX_SECONDS_TO_ASK_FLOW_NAME = 5;

@Component({
    selector: 'flogo-app-details-item',
    moduleId: module.id,
    templateUrl: 'application.tpl.html',
    styleUrls: [ 'application.component.css' ]
})
export class FlogoApplicationComponent implements OnChanges {
    @ViewChild('appInputName') appInputName: ElementRef;
    @ViewChild('appInputDescription') appInputDescription: ElementRef;
    @Input() application: IFlogoApplicationModel;
    searchPlaceHolder:string;
    editingDescription: boolean;
    editingName: boolean;
    flows: Array<IFlogoApplicationFlowModel> = [];

    constructor(
        public translate: TranslateService
    ) {
        this.searchPlaceHolder = this.translate.instant('DETAILS:SEARCH');
    }

    ngOnChanges(
        changes : {
            [ propKey : string ] : SimpleChange
        }
    ) {
        if(changes['application'].currentValue) {
            this.updateChanges();
        }
    }

    updateChanges() {
        this.flows = this.getOriginalFlows();
        let seconds = getDiffSecondBetweenDates(Date.now(), this.application.updatedAt);
        this.editingName = seconds <= MAX_SECONDS_TO_ASK_FLOW_NAME;
    }


  ngOnInit() {
      this.editingDescription = false;
      this.editingName = false;
      this.searchPlaceHolder= '';
  }

  getOriginalFlows() {
     return _.clone(this.application.flows || []);
  }


  onClickAddDescription(event) {
        this.editingDescription = true;
  }

  onInputDescriptionBlur(event) {
    this.editingDescription = false;
  }

  onInputNameChange(event) {
     this.application.updatedAt = new Date();
  }

  onInputNameBlur(event) {
     if(this.application.name) {
        this.editingName = false;
     }
  }

  onClickLabelName(event) {
     this.editingName = true;
  }

    onClickLabelDescription(event) {
        this.editingDescription = true;
    }

    onKeyUpName(event) {
        if(event.code == "Enter") {
            this.editingName = false;
        }
    }

    onKeyUpDescription(event) {
    }

    onChangedSearch(search) {
        let flows = this.application.flows || [];

        if(search && flows.length){
            let filtered =  flows.filter((flow:IFlogoApplicationFlowModel)=> {
                return (flow.name || '').toLowerCase().includes(search.toLowerCase()) ||
                       (flow.description || '').toLowerCase().includes(search.toLowerCase())
            });

            this.flows = filtered || [];

        }else {
            this.flows = this.getOriginalFlows();
        }
    }

}
