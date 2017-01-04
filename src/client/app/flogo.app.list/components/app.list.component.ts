import { Component, EventEmitter,  Input, OnChanges, Output, SimpleChange,  } from '@angular/core';
import {FlogoModal} from '../../../common/services/modal.service';
import { IFlogoApplicationModel } from '../../../common/application.model';
import { By } from '@angular/platform-browser';
import { RESTAPIApplicationsService } from '../../../common/services/restapi/applications-api.service';


@Component({
    selector: 'flogo-app-list',
    moduleId: module.id,
    templateUrl: 'app.list.tpl.html',
    styleUrls: ['app.list.css'],
    directives: [],
    providers: [FlogoModal ]

})
export class FlogoAppListComponent {
    @Output() onSelectedApp:EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();
    @Output() onAddedApp:EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();
    @Output() onDeletedApp:EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();

    public applications: Array<IFlogoApplicationModel> = [];
    selectedApp:IFlogoApplicationModel;
    overApp:IFlogoApplicationModel;

    constructor(public flogoModal: FlogoModal, private apiApplications: RESTAPIApplicationsService) {
        this.apiApplications.list()
            .then((applications:Array<IFlogoApplicationModel>)=> {
                this.applications = applications;
            })
    }

    onSelectApp(app:IFlogoApplicationModel) {
        this.selectedApp = app;
        this.onSelectedApp.emit(app);
    }

    confirmDelete(app:IFlogoApplicationModel) {

        this.flogoModal.confirmDelete('Are you sure you want to delete ' + app.name +  ' application?').then((res) => {
            if (res) {
                this._delete(app);
            } else {
            }
        });

    }

    onAdd(event) {
        this.apiApplications.add()
            .then((application:IFlogoApplicationModel)=> {
                this.onAddedApp.emit(application);
                this.onSelectApp(application);
            });
    }


    private _delete(application:IFlogoApplicationModel) {
        this.apiApplications.delete(application.id)
            .then(()=> {
                this.onDeletedApp.emit(application);
                this.selectedApp = null;
                this.overApp = null;
            });
    }

    onMouseOver(app: IFlogoApplicationModel) {
        this.overApp = app;
    }

    onMouseOut() {
        this.overApp = null;
    }

}
