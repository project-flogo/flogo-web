import { Component, Input } from '@angular/core';

@Component({
    selector: 'flogo-transform-visual-mapper-input',
    moduleId: module.id,
    styleUrls: ['visual-mapper-input.component.css'],
    templateUrl: 'visual-mapper-input.tpl.html'
})
export class VisualMapperInputComponent {
    @Input() tileInputInfo:any;
    showList:boolean;

    constructor() {
    }


    ngOnChanges(changes:any) {
    }


}

