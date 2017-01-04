import { Component, Input, OnChanges, AfterViewInit, OnInit, ViewChild, ElementRef, Renderer } from '@angular/core';
import { CanActivate /*,  RouteParams */ } from '@angular/router-deprecated';
import { isConfigurationLoaded } from '../../../common/services/configurationLoaded.service';
//import { TranslatePipe, TranslateService } from 'ng2-translate/ng2-translate';
import { TranslatePipe, TranslateService, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';
import { IFlogoApplicationFlowModel } from '../../../common/application.model';
//import { RESTAPIApplicationsService } from '../../../common/services/restapi/applications-api.service';
import { timeString } from '../../../common/utils';


@Component( {
    selector: 'flogo-app-flows',
    moduleId: module.id,
    directives: [],
    templateUrl: 'flows.tpl.html',
    styleUrls: [ 'flows.component.css' ],
    providers: [],
    pipes: [TranslatePipe]
} )
@CanActivate((next) => {
    return isConfigurationLoaded();
})
export class FlogoApplicationFlowsComponent implements AfterViewInit, OnInit  {
    @Input() flows: Array<IFlogoApplicationFlowModel> = [];

    constructor(
        /*private _routeParams: RouteParams,*/
        public translate: TranslateService,
        private renderer: Renderer //,
        /* private apiApplications: RESTAPIApplicationsService */
    ) {
    }

    ngOnInit() {
    }


    ngAfterViewInit() {
    }

    formatDate(date) {
        return moment(date).format("MM-DD-YYYY");
    }

}
