
import { Component, Input, OnChanges, EventEmitter } from '@angular/core';

@Component({
    selector: 'flogo-transform-json-panel',
    moduleId: module.id,
    templateUrl: 'transform-json-panel.tpl.html',
    outputs: ['toggledControl:toggled'],
    styleUrls: ['transform-json-panel.component.css']
})
export class TransformJsonPanelComponent implements OnChanges {
    @Input() schema: any = {};
    @Input() name: string = '';
    @Input() isInput: boolean = false;
    @Input() currentFieldSelected: any = {};
    isCollapsed:boolean = true;
    currentSchema:string = '';

    toggledControl:EventEmitter<any> = new EventEmitter();

    constructor() {

    }

    ngOnInit() {
        if(this.isInput) {
            this.currentSchema = this.getFormattedHTMLInput(this.schema, '');
        } else {
            this.currentSchema = this.getFormattedHTMLOutput(this.schema, '','');
        }
    }

    ngOnChanges(changes:any) {

        if(_.has(changes, 'currentFieldSelected')) {
            let itemSelected = changes.currentFieldSelected.currentValue;

            if(!_.isEmpty(itemSelected)) {
                if(this.isInput) {
                    if(itemSelected.tile) {
                        itemSelected.name = '';
                    }
                    this.currentSchema =  this.getFormattedHTMLInput(this.schema, itemSelected.name || '');
                }else {
                    this.currentSchema =  this.getFormattedHTMLOutput(this.schema, itemSelected.tile || '', itemSelected.name || '');
                }
            }
        }
    }

    togglePanel() {

        this.isCollapsed = !this.isCollapsed;

        this.toggledControl.emit({
            isInput:this.isInput,
            isCollapsed: this.isCollapsed
        });

        if(!this.isCollapsed) {
            if(this.isInput) {
                this.currentSchema =  this.getFormattedHTMLInput(this.schema,  '');
            }else {
                this.currentSchema =  this.getFormattedHTMLOutput(this.schema, '', '');
            }
        }

    }

    wrapInDiv(value:string, isSelected:boolean, leftMargin:string) {
        let html:string = '';

        html += `<div class="ft-json__selected"`;
        html += ' style="';

        if(isSelected) {
            html+= 'font-weight:bold;';
        }

        if(leftMargin) {
            html+= 'margin-left:' + leftMargin + ';';
        }

        html += '"';
        html += `>${value}</div>`;

        return html;
    }

    getFormattedHTMLInput(jsonSchema:any,  fieldSelected:string ) {
        let html:string = '';

        html += this.wrapInDiv('[', false, '-15px');

        let fieldCount = 1;

        jsonSchema.forEach( (item:any) => {
            let isSelected:boolean = false;
            let coma = '';
             if(fieldCount < jsonSchema.length) {
                coma = ',';
            }
            if(fieldSelected == item.name) {
                isSelected  = true;
            }

            html += this.wrapInDiv(`{`, isSelected, '10px');
            html += this.wrapInDiv(`"name":"${item.name}"`, isSelected, '20px');
            html += this.wrapInDiv(`"type":"${item.type}"`, isSelected, '20px');
            html += this.wrapInDiv(`}${coma}`, isSelected, '10px');

            fieldCount += 1;
        });


        /*
        for(var tile in jsonSchema) {
            // Check if is an array, in this case if is a tile
            if(jsonSchema[tile] instanceof Array) {

                html += this.wrapInDiv(`"${tile}":[`,false,'');

                let countField:number = 1;
                for(var fieldIndex in jsonSchema[tile]) {
                    html += this.wrapInDiv('{', false,'10px');
                    isSelected =  (tile == tileSelected && jsonSchema[tile][fieldIndex]['name'] == fieldSelected);

                    for(var field in jsonSchema[tile][fieldIndex]) {
                        html += this.wrapInDiv(`"${field}":"${jsonSchema[tile][fieldIndex][field]}"`, isSelected, '20px');
                    }

                    if(countField < jsonSchema[tile].length ) {
                        html += this.wrapInDiv('},', false,'10px');
                    } else {
                        html += this.wrapInDiv('}', false,'10px');
                    }

                    countField += 1;
                }

                html += this.wrapInDiv(']', false,'');
            }
        }
        */

        html += this.wrapInDiv(']', false, '-15px');

        return html;
    }

    getFormattedHTMLOutput(jsonSchema:any, tileSelected:string, fieldSelected:string ) {
        let html:string = '';
        let isSelected:boolean = false;

        html += this.wrapInDiv('{', false, '-10px');
        for(var tile in jsonSchema) {

            // Check if is an array, in this case if is a tile
            if(jsonSchema[tile] instanceof Array) {

                html += this.wrapInDiv(`"${tile}":[`,false,'');

                let countField:number = 1;
                for(var fieldIndex in jsonSchema[tile]) {
                    html += this.wrapInDiv('{', false,'5px');
                    isSelected =  (tile == tileSelected && jsonSchema[tile][fieldIndex]['name'] == fieldSelected);

                    for(var field in jsonSchema[tile][fieldIndex]) {
                        html += this.wrapInDiv(`"${field}":"${jsonSchema[tile][fieldIndex][field]}"`,
                            isSelected, '10px');
                    }

                    if(countField < jsonSchema[tile].length ) {
                        html += this.wrapInDiv('},', false,'5px');
                    } else {
                        html += this.wrapInDiv('}', false,'5px');
                    }

                    countField += 1;
                }

                html += this.wrapInDiv(']', false,'');
            }
        }

        html += this.wrapInDiv('}', false, '-15px');

        return html;
    }

}
