import { Component, EventEmitter,  Input, OnChanges, Output, SimpleChange,  } from '@angular/core';
import {FlogoModal} from '../../../common/services/modal.service';
import { IFlogoApplicationModel } from '../../../common/application.model';
import { By } from '@angular/platform-browser';

const UNTITLED_APP = 'Untitled App';

@Component({
    selector: 'flogo-app-list',
    moduleId: module.id,
    templateUrl: 'app.list.tpl.html',
    styleUrls: ['app.list.css'],
    directives: [],
    providers: [FlogoModal]

})
export class FlogoAppListComponent {
    @Input() applications: Array<IFlogoApplicationModel>;
    @Output() onSelectedApp:EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();
    @Output() onAddedApp:EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();
    @Output() onDeletedApp:EventEmitter<IFlogoApplicationModel> = new EventEmitter<IFlogoApplicationModel>();
    selectedApp:IFlogoApplicationModel;
    overApp:IFlogoApplicationModel;

    constructor(public flogoModal: FlogoModal) {
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
                // omit
            }
        });

    }


    public add() {
        this._add();
    }

    public _add() {
        let application = <IFlogoApplicationModel> {
            id: this.applications.length + 1,
            name: this.getNewAppName(UNTITLED_APP),
            version: '',
            description: '',
            createdAt: new Date(),
            updatedAt: null
        };

        this.applications.unshift(application);
        this.onAddedApp.emit(application);

        this.onSelectApp(application);
    }

    private _delete(app:IFlogoApplicationModel) {
        _.remove(this.applications, (n:IFlogoApplicationModel)=> {
            return n.name === app.name;
        });

        this.onDeletedApp.emit(app);
        this.selectedApp = this.overApp = null;
    }

    getNewAppName(name:string, count = 0) {
        let appName:string = name +  (count > 0 ?   ` (${count})` : '');
        let found: IFlogoApplicationModel;

        found = this.applications.find((app: IFlogoApplicationModel)=> {
                return app.name == appName;
            });

        if(found) {
            return this.getNewAppName(name , ++count);
        } else {
            return appName;
        }
    }

    onMouseOver(app: IFlogoApplicationModel) {
        this.overApp = app;
    }

    onMouseOut() {
        this.overApp = null;
    }

}
