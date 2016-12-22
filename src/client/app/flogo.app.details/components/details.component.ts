import { Component, OnChanges, AfterViewInit, ViewChild, ElementRef, Renderer } from '@angular/core';
import { CanActivate,  RouteParams } from '@angular/router-deprecated';
import { isConfigurationLoaded } from '../../../common/services/configurationLoaded.service';
import { TranslatePipe, TranslateService } from 'ng2-translate/ng2-translate';
import { IFlogoApplicationModel } from '../../../common/application.model';
import { timeString } from '../../../common/utils';

import {
    notification,
} from '../../../common/utils';

import { Contenteditable, JsonDownloader } from '../../../common/directives';


@Component( {
    selector: 'flogo-app-details',
    moduleId: module.id,
    directives: [ Contenteditable ],
    templateUrl: 'details.tpl.html',
    styleUrls: [ 'details.component.css' ],
    providers: [],
    pipes: [TranslatePipe]
} )
@CanActivate((next) => {
    return isConfigurationLoaded();
})
export class FlogoApplicationDetailsComponent implements AfterViewInit  {
    @ViewChild('appName') appName: ElementRef;
    @ViewChild('appDescription') appDescription: ElementRef;
    application: IFlogoApplicationModel = null;
    createdAtFormatted: any;
    editingDescription: boolean = false;
    editingName: boolean = false;

    constructor(
        private _routeParams: RouteParams,
        public translate: TranslateService,
        private renderer: Renderer
    ) {
        this.application = this._routeParams.params["application"] as IFlogoApplicationModel;
        this.init();
    }

    init() {
        // format create at
        let timeStr = timeString(this.application.createdAt);
        this.createdAtFormatted = moment(timeStr, 'YYYYMMDD hh:mm:ss').fromNow();

        if(this.application.updatedAt == null) {
            this.editingName = true;
        }else {
            this.editingName = false;
        }
    }

    ngAfterViewInit() {
        if(this.application.updatedAt == null) {
           this.renderer.invokeElementMethod(this.appName.nativeElement, 'focus',[]);
        }
    }

    onClickAddDescription(event) {
        this.editingDescription = true;
        // wait to refresh view
        setTimeout(()=> {
            this.renderer.invokeElementMethod(this.appDescription.nativeElement, 'focus',[]);
        }, 0);
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
        setTimeout(()=> {
            this.renderer.invokeElementMethod(this.appName.nativeElement, 'focus',[]);
        },0);
    }

    onClickLabelDescription(event) {
        this.editingDescription = true;
        setTimeout(()=> {
            this.renderer.invokeElementMethod(this.appDescription.nativeElement, 'focus',[]);
        },0);
    }

    onKeyUpName(event) {
        if(event.code == "Enter") {
            this.editingName = false;
        }
    }

    onKeyUpDescription(event) {
        if(event.code == "Enter") {
            this.editingDescription = false;
        }
    }

}
