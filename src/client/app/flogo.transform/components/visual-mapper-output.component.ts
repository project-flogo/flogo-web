import { Component, Input } from '@angular/core';

@Component({
    selector: 'flogo-transform-visual-mapper-output',
    moduleId: module.id,
    styleUrls: ['visual-mapper.component.css'],
    templateUrl: 'visual-mapper-output.tpl.html'
})
export class VisualMapperOutputComponent {
    @Input() outputs:any;
    showList:boolean;
    selectedValue: string;
    tilesOutputs:any[] = [];

    constructor() {
        this.showList = false;
    }

    focus(event:any) {
        this.showList =  true;
    }

    blur(event:any) {
        this.showList = false;
    }

    ngOnChanges(changes:any) {
    }

    clickField(output:any, field:any) {
        this.selectedValue = output.name + '.' + field.name;
        this.showList = false;
    }

    onKeyPress(event) {
        if(event.keyCode == 27) {
            this.showList = false;
        }
    }

}

