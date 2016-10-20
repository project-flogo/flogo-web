import { Component, Input, Output, ElementRef, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { mappingsValidateField } from '../validators/validators';

@Component({
    host: {
        '(document: click)': 'onClick($event)'
    },
    selector: 'flogo-transform-mapper-field',
    moduleId: module.id,
    styleUrls: ['transform-mapper-field.component.css'],
    templateUrl: 'transform-mapper-field.tpl.html'
})
export class TransformMapperField implements  OnChanges, OnInit {
    @Input() tile:any;
    @Input() mappings:any;
    @Input() precedingTilesOutputs:any;
    @Input() tileInputInfo:any;
    @Input() tileInfo:any;
    @Output() mappingChange:EventEmitter<any>;
    @Output() itemOver:EventEmitter<any>;

    selectedValue:string = '';
    showList:boolean  = false;
    tiles:any[] = [];
    hasError:boolean = false;
    messageError:string = '';
    errors:any;
    selectedTile:string = '';
    selectedInput:string = '';
    overInput:boolean = false;

    constructor(private _eref: ElementRef) {
        this.mappingChange = new EventEmitter();
        this.itemOver      = new EventEmitter();
    }

    onClick(event) {
        let nativeElement = this._eref.nativeElement;

        if (event.target !== nativeElement && !nativeElement.contains(event.target)) {
            this.showList = false;
        }

    }

    ngOnInit() {
    }

    onMouseLeave(tile:string, field:string) {
       this.emittItemOver('', '');
        this.overInput = false;
    }

    onMouseOver(tile:string, field:string, type:string) {
        this.emittItemOver(tile, field);
        if(type == 'input') {
            this.overInput = true;
        }
    }

    emittItemOver(tile:string, field: string) {
        this.itemOver.emit({tile:tile, name: field });
    }

    resetStatus() {
        this.selectedTile = '';
        this.selectedInput = '';
        this.showList = false;

    }

    onFocusText(input: string) {
        this.selectedTile = '';
        this.selectedInput = input;
        this.showList = true;
    }

    onKeyUp(value:string) {
      this.emitChange(value);
    }

    emitChange(value:string) {
        this.validateField(value);

        this.mappingChange.emit({
            field: this.tile.name,
            value:value,
            hasError: this.hasError,
            errors: this.errors
        });
    }

    setSelectedTile(value:string) : void {

        if(this.selectedTile == value) {
            this.selectedTile = '';
        } else {
            this.selectedTile = value;
        }
    }

    validateField(value:string) {
        if(!value) {
            this.setError(false, '');
        } else {

          this.errors = mappingsValidateField(this.tileInfo, this.wrapInJSON(value));
          if(this.errors&&this.errors.invalidMappings) {
            this.setError(true,this.getErrorMessage(this.errors.invalidMappings.errors || []) )
          }else {
            this.setError(false, '');
          }
        }


    }

    setError(hasError:boolean, message:string) {
        this.hasError = hasError;
        this.messageError  = message;
    }

    getErrorMessage(errors:any[]) {
        let message = '';

        errors.forEach(function (error) {
            message += 'Invalid field \n' + error.value.value + ' mapping to ' + error.value.mapTo;
        });
        return message;
    }

    precedingTilesToArray(precedingTiles:any) {
        var tiles = [];

        for(var tileName in precedingTiles || {}) {
            var tile = {name: tileName, fields: precedingTiles[tileName]};
            tiles.push(tile);
        }

        return tiles;
    }

    ngOnChanges(changes:any) {

        let mapping = this.mappings.find((item) => {
            return item.mapTo == this.tile.name;
        });

        if(mapping) {
            this.selectedValue = mapping.value;
            this.emitChange(this.selectedValue);

        }

        if(changes.precedingTilesOutputs && this.tiles) {
            this.tiles = this.precedingTilesToArray(changes.precedingTilesOutputs.currentValue);
        }

    }

    toggleList() {
        this.showList = !this.showList;
    }

    onKeyPress(event) {
        if(event.keyCode == 27) {
            this.showList = false;
            this.selectedInput = '';
        }
    }

    clickField(output, field) {
        this.selectedValue = output.name + '.' + field.name;
        this.emitChange(this.selectedValue);
        this.showList = false;
        return true;
    }

    clickRemove(event) {
        this.selectedValue = '';
        this.showList = false;

        this.setError(false, '');
        this.emitChange('');
    }

    wrapInJSON(value) {
        return '[ { "type": 1, "value": "' + value + '", "mapTo": "' + this.tile.name + '" } ]'

    }


}
