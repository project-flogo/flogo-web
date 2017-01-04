import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CanActivate } from '@angular/router-deprecated';
import { isConfigurationLoaded } from '../../../common/services/configurationLoaded.service';

@Component({
    selector: 'flogo-app-search',
    moduleId: module.id,
    templateUrl: 'search.tpl.html',
    styleUrls:['search.component.css']
})
@CanActivate((next) => {
    return isConfigurationLoaded();
})
export class FlogoApplicationSearch {
    @Input() placeholder: string = '';
    @Output() changedSearch: EventEmitter<string> = new EventEmitter<string>();


    onSearchInputChanged(events) {
        this.changedSearch.emit(events.target.value);
    }


}
