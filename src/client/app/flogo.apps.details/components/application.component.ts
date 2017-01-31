import { Component, Input, Output, SimpleChanges, OnChanges, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { IFlogoApplicationModel, IFlogoApplicationFlowModel } from '../../../common/application.model';
import { AppDetailService, ApplicationDetail, ApplicationDetailState } from '../../flogo.apps/services/apps.service';
import { FlogoFlowsAddComponent } from '../../flogo.flows.add/components/add.component';

import { diffDates, notification } from '../../../common/utils';
import { FlogoModal } from '../../../common/services/modal.service';

const MAX_SECONDS_TO_ASK_FLOW_NAME = 5;


@Component({
  selector: 'flogo-apps-details-application',
  moduleId: module.id,
  templateUrl: 'application.tpl.html',
  styleUrls: ['application.component.css']
})
export class FlogoApplicationComponent implements OnChanges, OnInit {
  @ViewChild(FlogoFlowsAddComponent) addFlow: FlogoFlowsAddComponent;
  @Input() appDetail: ApplicationDetail;

  @Output() flowSelected: EventEmitter<IFlogoApplicationFlowModel> = new EventEmitter<IFlogoApplicationFlowModel>();
  @Output() flowAdded: EventEmitter<IFlogoApplicationFlowModel> = new EventEmitter<IFlogoApplicationFlowModel>();
  @Output() onDeletedApp: EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();

  application: IFlogoApplicationModel;
  state: ApplicationDetailState;

  isNameInEditMode: boolean;
  autofocusName: boolean = true;
  editableName: string;

  isDescriptionInEditMode: boolean;
  editableDescription: string;

  flows: Array<IFlogoApplicationFlowModel> = [];

  isNewApp: boolean = false;

  constructor(public translate: TranslateService,
              private appDetailService: AppDetailService,
              public flogoModal: FlogoModal) {
  }

  ngOnInit() {
    this.isDescriptionInEditMode = false;
    this.isNameInEditMode = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    let change = changes['appDetail'];
    if (change.currentValue) {
      this.application = this.appDetail.app;
      this.state = this.appDetail.state;
      this.flows = this.extractFlows();

      let prevValue = change.previousValue;
      let isDifferentApp = !prevValue || !prevValue.app || prevValue.app.id != this.application.id;
      if (isDifferentApp) {
        this.appUpdated();
      } else {
        this.appDetailChanged();
      }
    }
  }

  appExporter() {
    return () => this.appDetailService.toEngineSpec()
      .then(engineApp => {
        return [{
          fileName: 'app.json',
          data: engineApp
        }];
      });
  }

  openCreateFlow() {
    this.addFlow.open();
  }

  onClickAddDescription(event) {
    this.isDescriptionInEditMode = true;
  }

  onNameSave() {
    let editableName = this.editableName || '';
    editableName = editableName.trim();
    if (!editableName) {
      return;
    }
    this.isNameInEditMode = false;
    this.appDetailService.update('name', editableName);
  }

  onNameCancel() {
    this.isNameInEditMode = false;
    this.appDetailService.cancelUpdate('name');
    this.editableName = this.application.name;
  }

  onDescriptionSave() {
    this.isDescriptionInEditMode = false;
    this.appDetailService.update('description', this.editableDescription);
  }

  onDescriptionCancel() {
    this.isDescriptionInEditMode = false;
    this.appDetailService.cancelUpdate('description');
    this.editableDescription = this.application.description;
  }

  onClickLabelDescription() {
    this.isDescriptionInEditMode = true;
  }

  onClickLabelName() {
    this.isNameInEditMode = true;
  }

  onChangedSearch(search) {
    let flows = this.application.flows || [];

    if (search && flows.length) {
      let filtered = flows.filter((flow: IFlogoApplicationFlowModel) => {
        return (flow.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (flow.description || '').toLowerCase().includes(search.toLowerCase())
      });

      this.flows = filtered || [];

    } else {
      this.flows = this.extractFlows();
    }
  }

  onFlowSelected(flow) {
    this.flowSelected.emit(flow);
  }

  onFlowImportSuccess(result: any) {
    let message = this.translate.instant('FLOWS:SUCCESS-MESSAGE-IMPORT');
    notification(message, 'success', 3000);
    this.flowAdded.emit(result);
  }

  onFlowImportError(err: {
    status: string;
    statusText: string;
    response: any
  }) {
    let message = this.translate.instant('FLOWS:ERROR-MESSAGE-IMPORT', {value: err.response});
    notification(message, 'error');
  }

  onDeleteApp(application) {
    let message = this.translate.instant('APP-DETAIL:CONFIRM_DELETE', { appName: application.name })
    this.flogoModal.confirmDelete(message).then((res) => {
      if (res) {
        this.appDetailService.deleteApp();
      }
    });
  }

  private appUpdated() {
    this.isDescriptionInEditMode = false;

    this.editableName = this.application.name;
    this.editableDescription = this.application.description;

    this.isNameInEditMode = false;
    this.isNewApp = !this.application.updatedAt;
    if (this.isNewApp) {
      let secondsSinceCreation = diffDates(Date.now(), this.application.createdAt, 'seconds');
      this.isNewApp = secondsSinceCreation <= MAX_SECONDS_TO_ASK_FLOW_NAME;
      this.isNameInEditMode = this.isNewApp;
    }

  }

  private appDetailChanged() {
    if (this.state.name.hasErrors) {
      this.isNameInEditMode = true;
      this.autofocusName = false;
      setTimeout(() => this.autofocusName = true, 100);
    } else if (!this.state.name.pendingSave) {
      this.editableName = this.application.name;
    }
  }

  private extractFlows() {
    return _.clone(this.application.flows || []);
  }

}
