import {Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';

import {FlogoModal} from '../../../common/services/modal.service';
import {IFlogoApplicationModel} from '../../../common/application.model';
import {RESTAPIApplicationsService} from '../../../common/services/restapi/applications-api.service';
import { notification } from '../../../common/utils';

@Component({
  selector: 'flogo-apps-list',
  moduleId: module.id,
  templateUrl: 'app.list.tpl.html',
  styleUrls: ['app.list.css']
})
export class FlogoAppListComponent implements OnInit, OnChanges {
  @Input() currentApp: IFlogoApplicationModel;
  @Output() onSelectedApp: EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();
  @Output() onAddedApp: EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();
  @Output() onDeletedApp: EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();

  public applications: Array<IFlogoApplicationModel> = [];

  constructor(public flogoModal: FlogoModal,
              public translate: TranslateService,
              private apiApplications: RESTAPIApplicationsService) {
  }

  ngOnInit() {
    this.listAllApps();
  }

  ngOnChanges(changes: SimpleChanges) {
    let change = changes['currentApp'];
    if (change) {
      let prevId = change.previousValue && change.previousValue.id;
      let currentId = change.currentValue && change.currentValue.id;

      if (prevId != currentId) {
        this.listAllApps();
      }

    }
  }

  onSelectApp(app: IFlogoApplicationModel) {
    this.onSelectedApp.emit(app);
  }

  confirmDelete(event:Event, app: IFlogoApplicationModel) {
    // TODO: i18n
    event.stopPropagation();
    this.flogoModal.confirmDelete('Are you sure you want to delete ' + app.name + ' application?').then((res) => {
      if (res) {
        this.remove(app);
      }
    });
  }

  onImportFileSelected(event) {
    let file = <File> _.get(event,'target.files[0]');

    // clean input file value
    event.target.value = '';

    this.apiApplications.uploadApplication(file)
      .then((results: any) => {
        let createdApp = results.createdApp;
        this.applications.push(createdApp);
        let message = this.translate.instant('APP-LIST:SUCCESSFULLY_IMPORTED');
        this.onSelectApp(createdApp);
        notification(message, 'success', 3000);
      })
      .catch((errors) => {
        if (errors.length) {
          notification('Error:' + errors[0].detail, 'error');
        }
      });
  }

  onAdd(event) {
    this.apiApplications.createNewApp()
      .then((application: IFlogoApplicationModel) => {
        this.onAddedApp.emit(application);
        this.onSelectApp(application);
      }).then(() => this.listAllApps());
  }

  listAllApps() {
    this.apiApplications.getAllApps()
      .then((applications: Array<IFlogoApplicationModel>) => {
        this.applications = applications;
      })
  }

  private remove(application: IFlogoApplicationModel) {
    this.apiApplications.deleteApp(application.id)
      .then(() => {
        this.listAllApps();
        this.onDeletedApp.emit(application);
      })
  }

}
