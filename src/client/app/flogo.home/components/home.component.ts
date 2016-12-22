import { Component, OnChanges, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RouteConfig, RouterOutlet, RouteParams, Router, CanActivate } from '@angular/router-deprecated';
import { isConfigurationLoaded } from '../../../common/services/configurationLoaded.service';
import { TranslatePipe, TranslateService } from 'ng2-translate/ng2-translate';
import { FlogoApplicationDetailsComponent } from '../../flogo.app.details/components/details.component';
import { FlogoAppListComponent } from '../../flogo.app.list/components/app.list.component';
import { FlogoMainComponent } from '../../flogo.main/components/main.component';
import { IFlogoApplicationModel } from '../../../common/application.model';

import {
    notification,
} from '../../../common/utils';

import { Contenteditable, JsonDownloader } from '../../../common/directives';
import { FlogoModal } from '../../../common/services/modal.service';


@Component( {
    selector: 'flogo-home',
    moduleId: module.id,
    directives: [ RouterOutlet, Contenteditable, FlogoAppListComponent ],
    templateUrl: 'home.tpl.html',
    styleUrls: [ 'home.component.css' ],
    providers: [ FlogoModal ],
    pipes: [TranslatePipe]
} )
@CanActivate((next) => {
    return isConfigurationLoaded();
})


@RouteConfig([
    {path: '/', name: 'FlogoMain', component: FlogoMainComponent, useAsDefault: true},
    {path: '/application/:id', name: 'FlogoApplicationDetails', component: FlogoApplicationDetailsComponent }
])

export class FlogoHomeComponent implements  OnInit {
    @ViewChild('appList') appList: ElementRef;
    mockApps: Array<IFlogoApplicationModel> = [];
    selectedApp:IFlogoApplicationModel = null;

    constructor(
        private _router: Router,
        private _flogoModal: FlogoModal,
        private _routerParams: RouteParams,
        public translate: TranslateService
    ) {
    }

    ngOnInit() {
        this.mockApps.push(
            <IFlogoApplicationModel> {
                id: "1",
                name: "Sample Application",
                version: "0.0.1",
                description: "My App",
                createdAt: new Date(),
                updatedAt: new Date()
            });

    }

    onAdd(event) {
        this.appList['add']();
    }

    onSelectedApp(application:IFlogoApplicationModel) {
        this.selectedApp = application;

        this._router.navigate([
            'FlogoApplicationDetails',
            {id: application.id,
             application: application}
        ]);
    }

    onDeletedApp(application:IFlogoApplicationModel) {
        this._router.navigate(['FlogoMain']);
    }

}
