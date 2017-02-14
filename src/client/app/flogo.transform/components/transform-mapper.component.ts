import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { TileInOutInfo } from '../models/tile-in-out-info.model';

@Component({
    selector: 'flogo-transform-mapper',
    moduleId: module.id,
    templateUrl: 'transform-mapper.tpl.html',
    styleUrls: ['transform-mapper.component.css']
})
export class TransformMapperComponent implements OnChanges {
    @Output() mappingChange:EventEmitter<any>;

    @Input() mappings:any = '';
    @Input() tileInputInfo:any = null;
    @Input() precedingTilesOutputs:any = [];
    @Output() selectedItem:EventEmitter<any>;

    transformationJSON:string = '';

    private tileInfo:TileInOutInfo = {
        attributes: {},
        precedingOutputs: {}
    };


    constructor() {
        this.mappingChange = new EventEmitter();
        this.selectedItem = new EventEmitter();
    }

    ngOnChanges(changes:any) {

        if (changes.mappings) {
            this.onMappingsChange(changes.mappings);
        }

        if (changes.tileInputInfo && this.tileInputInfo) {
            this.tileInfo.attributes = this.extractInputs(this.tileInputInfo);
        }

        if (changes.precedingTilesOutputs && this.precedingTilesOutputs) {
            this.tileInfo.precedingOutputs = this.extractPrecedingOutputs(this.precedingTilesOutputs);
        }
    }

    onItemOver(params:any) {
        this.selectedItem.emit(params);
    }


    private onMappingsChange(mappingsChange:any) {
        let nextValue = mappingsChange.currentValue;
        let currentEditorValue:any = null;
        try {
            currentEditorValue =  this.transformationJSON;
        } catch (e) { // current val is just not valid json
        }

        if (!_.isEqual(mappingsChange.previousValue, nextValue) && !_.isEqual(nextValue, currentEditorValue)) {
            let stringified = JSON.stringify(nextValue || [], null, 2);
        }
    }

    private extractInputs(tileInputs:any) {
        let inputMap = {};

        if(tileInputs) {
            tileInputs.forEach(attr => {
                inputMap[attr.name] = attr.type;
            });
        }

        return inputMap;
    }

    private extractPrecedingOutputs(precedingTiles:any) {
        return precedingTiles ? _.reduce(precedingTiles, (allOutputNames:any, tileOutputs:any[], tileName:any) => {
            tileOutputs.forEach(output => {
                let path = `${tileName}.${output.name}`;
                allOutputNames[path] = output;
            });
            return allOutputNames;
        }, {}) : {};
    }

    private onMappingChange(event) {
        this.mappingChange.emit(event);
    }


}
