import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { FORM_DIRECTIVES, Control, Validator, Validators } from '@angular/common';
import { Observable } from 'rxjs/Rx';

import { TileInOutInfo } from '../models/tile-in-out-info.model';
import { jsonValidator, mappingsValidatorFactory } from '../validators/validators';

@Component({
  selector: 'flogo-transform-map-editor',
  directives: [FORM_DIRECTIVES],
  moduleId: module.id,
  styleUrls: ['map-editor.component.css'],
  templateUrl: 'map-editor.tpl.html'
})
export class MapEditorComponent implements OnChanges, OnInit {

  @Output() mappingChange:EventEmitter<any>;
  @Input() mappings:any = '';

  @Input() tileInputInfo:any = null;
  @Input() precedingTilesOutputs:any[] = [];

  editor:Control;

  private tileInfo:TileInOutInfo = {
    attributes: {},
    precedingOutputs: {}
  };

  constructor() {
    this.mappingChange = new EventEmitter();
    let mappingsValidator = mappingsValidatorFactory(this.tileInfo);
    this.editor = new Control('', Validators.compose([Validators.required, jsonValidator, mappingsValidator]));
    this
      .editor
      .valueChanges
      .debounceTime(300)
      .distinctUntilChanged()
      .map((rawVal:string) => {
        return {
          isValid: this.editor.valid,
          isDirty: this.editor.dirty,
          errors: this.editor.errors,
          value: this.editor.valid ? JSON.parse(rawVal) : null
        };
      })
      .distinctUntilChanged((prev:any, next:any) => _.isEqual(prev, next))
      .do((val) => {
        console.group('emitted val');
        console.log(val);
        console.groupEnd();
      })
      .subscribe(val => this.mappingChange.emit(val));

  }

  ngOnInit() {

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

  private onMappingsChange(mappingsChange:any) {
    let nextValue = mappingsChange.currentValue;
    let currentEditorValue:any = null;
    try {
      currentEditorValue = JSON.parse(this.editor.value);
    } catch (e) { // current val is just not valid json
    }

    if (!_.isEqual(mappingsChange.previousValue, nextValue) && !_.isEqual(nextValue, currentEditorValue)) {
      let stringified = JSON.stringify(nextValue || [], null, 2);
      this.editor.updateValue(stringified, {onlySelf: true, emitEvent: false});
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

}
