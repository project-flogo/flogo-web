import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'flogo-transform-visual-mapper',
    moduleId: module.id,
    templateUrl: 'visual-mapper.tpl.html',
    styleUrls: ['visual-mapper.component.css']
})

export class VisualMapperComponent {
    @Output() mappingChange:EventEmitter<any>;
    @Input() mappings:any = '';
    @Input() precedingTilesOutputs:any[] = [];
    @Input() tileInputInfo:any;
    outputs:any[] = [];
    showList:boolean = false;
    selectedValue:string;
    input:any;

    constructor() {
        this.selectedValue = '';
        this.showList = false;
        this.mappingChange = new EventEmitter();
    }

    precedingTilesToArray(precedingTiles:any) {
        var tiles = [];

        for(var tileName in precedingTiles || {}) {
            var tile = {name: tileName, fields: precedingTiles[tileName]};
            tiles.push(tile);
        }

        return tiles;
    }

    focusInputText() {
        this.showList = true;
    }

    onKeyPress(event) {
        if(event.keyCode == 27) {
            this.showList = false;
        }
    }

    clickField(output, field) {
        this.selectedValue = output.name + '.' + field.name;
        this.showList = false;
    }

    ngOnChanges(changes:any) {
        this.outputs = this.precedingTilesToArray(changes.precedingTilesOutputs.currentValue);
        this.input = changes.tileInputInfo.currentValue;
    }

    clickRemove() {
        this.selectedValue = '';
        this.showList = false;
    }


}
