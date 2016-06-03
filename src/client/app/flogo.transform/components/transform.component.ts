import {Component, ViewChild, ElementRef, OnDestroy, HostListener} from '@angular/core';

import {PostService} from '../../../common/services/post.service';

import {FLOGO_TASK_ATTRIBUTE_TYPE as ATTRIBUTE_TYPE, FLOGO_TASK_TYPE as TASK_TYPE} from '../../../common/constants';
import {REGEX_INPUT_VALUE_INTERNAL, REGEX_INPUT_VALUE_EXTERNAL} from '../constants';
import {PUB_EVENTS, SUB_EVENTS} from '../messages';
import {MapEditorComponent} from './map-editor.component';
import {ErrorDisplayComponent} from './error-display.component';
import {HelpComponent} from "./help.component";

import {normalizeTaskName, convertTaskID} from '../../../common/utils';

const TILE_MAP_ROOT_KEY = 'root-task';

interface TransformData {
  result:any,
  precedingTiles:any[],
  precedingTilesOutputs:any[],
  tile:any,
  tileInputInfo:any,
  mappings:any
}

@Component({
  selector: 'flogo-transform',
  directives: [MapEditorComponent, ErrorDisplayComponent, HelpComponent],
  moduleId: module.id,
  styleUrls: ['transform.component.css'],
  templateUrl: 'transform.tpl.html',
})
export class TransformComponent implements OnDestroy {

  isValid:boolean;
  isDirty:boolean;

  errors:any;

  // two variables control the display of the modal to support animation when opening and closing
  active:boolean = false; // controls the rendering of the content of the modal
  out:boolean = false; // controls the in/out transition of the modal

  showDeleteConfirmation:boolean = false;
  @ViewChild('deleteContainer') deleteContainer:ElementRef;

  private _subscriptions:any[];
  private data:TransformData = {
    result: null,
    precedingTiles: [],
    precedingTilesOutputs: [],
    tile: null,
    tileInputInfo: null,
    mappings: null
  };

  constructor(private _postService:PostService) {
    this.initSubscriptions();
    this.resetState();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  onMappingsChange(change:any) {
    this.isValid = change.isValid;
    this.isDirty = change.isDirty;

    if (change.isValid) {
      this.data.result = change.value;
      this.errors = null;
    } else {
      this.errors = change.errors;
    }

  }

  saveTransform() {
    this._postService.publish(_.assign({}, PUB_EVENTS.saveTransform, {
      data: {
        tile: this.data.tile,
        inputMappings: this.transformMappingsToExternalFormat(this.data.result)
      }
    }));
    this.close();
  }

  deleteTransform() {
    this._postService.publish(_.assign({}, PUB_EVENTS.deleteTransform, {
      data: {
        tile: this.data.tile
      }
    }));
    this.close();
  }

  cancel() {
    this.close();
  }

  openDeleteConfirmation(event:Event) {
    this.showDeleteConfirmation = true;
    event.stopPropagation();
  }

  cancelDeleteConfirmation() {
    this.showDeleteConfirmation = false;
  }

  @HostListener('click', ['$event'])
  clickOutsideDeleteConfirmation(event:Event) {
    if (this.showDeleteConfirmation && this.deleteContainer && !this.deleteContainer.nativeElement.contains(event.target)) {
      this.showDeleteConfirmation = false;
    }
  }

  private initSubscriptions() {

    let subHandlers = [
      _.assign({}, SUB_EVENTS.selectActivity, {callback: this.onTransformSelected.bind(this)})
    ];

    this._subscriptions = subHandlers.map(handler => this._postService.subscribe(handler));

  }

  private cancelSubscriptions() {
    if (_.isEmpty(this._subscriptions)) {
      return true;
    }
    this._subscriptions.forEach(this._postService.unsubscribe);
    return true;
  }

  private onTransformSelected(data:any, envelope:any) {
    this.data = {
      result: null,
      precedingTiles: data.previousTiles,
      precedingTilesOutputs: this.extractPrecedingTilesOutputs(data.previousTiles),
      tile: data.tile,
      tileInputInfo: this.extractTileInputInfo(data.tile || {}),
      mappings: data.tile.inputMappings ? _.cloneDeep(data.tile.inputMappings) : []
    };
    this.data.mappings = this.transformMappingsToInternalFormat(this.data.mappings);

    this.resetState();

    this.open();

  }

  private extractPrecedingTilesOutputs(precedingTiles:any[]) {
    return _.chain(precedingTiles || [])
      .filter((tile:any) => {
        let attrHolder = tile.type == TASK_TYPE.TASK_ROOT ? tile : tile.attributes;
        return attrHolder && attrHolder.outputs && attrHolder.outputs.length > 0;
      })
      .map((tile:any) => {
        let name = normalizeTaskName(tile.name);
        let attrHolder = tile.type == TASK_TYPE.TASK_ROOT ? tile : tile.attributes;
        let outputs = attrHolder.outputs.map(this.mapInOutObjectDisplay);
        return [name, outputs];
      })
      .fromPairs()
      .value();
  }

  private extractTileInputInfo(tile:any) {
    return (tile.attributes && tile.attributes.inputs) ? tile.attributes.inputs.map(this.mapInOutObjectDisplay) : [];
  }

  private mapInOutObjectDisplay(inputOutput:{name:string, type:ATTRIBUTE_TYPE}) {
    return {
      name: inputOutput.name,
      type: ATTRIBUTE_TYPE[inputOutput.type].toLowerCase()
    };
  }

  private transformMappingsToExternalFormat(mappings:any[]) {
    let tileMap:any = {};
    _.forEach(this.data.precedingTiles, (tile:any) => {
      tileMap[normalizeTaskName(tile.name)] = {
        id: convertTaskID(tile.id),
        isRoot: tile.type == TASK_TYPE.TASK_ROOT
      };
    });

    let re = REGEX_INPUT_VALUE_INTERNAL;

    mappings.forEach(mapping => {
      let matches = re.exec(mapping.value);
      if (!matches) {
        return; // ignoring it
      }

      let taskInfo = tileMap[matches[2]];
      let property = matches[3];
      let path = taskInfo.isRoot ? `T.${property}` : `A${taskInfo.id}.${property}`;
      let rest = matches[4] || '';
      mapping.value = `[${path}]${rest}`;
    });

    return mappings;

  }

  private transformMappingsToInternalFormat(mappings:any[]) {
    let tileMap:any = {};
    _.forEach(this.data.precedingTiles, (tile:any) => {
      let tileId = convertTaskID(tile.id) || undefined;
      tileMap[tileId] = normalizeTaskName(tile.name);
      if(tile.type == TASK_TYPE.TASK_ROOT) {
        tileMap[TILE_MAP_ROOT_KEY] = tileMap[tileId];
      }
    });

    let re = REGEX_INPUT_VALUE_EXTERNAL;

    mappings.forEach(mapping => {
      let matches = re.exec(mapping.value);
      if (!matches) {
        return; // ignoring it
      }

      let taskName = tileMap[matches[2]] || tileMap[TILE_MAP_ROOT_KEY];
      let property = matches[3];
      let rest = matches[4] || '';
      mapping.value = `${taskName}.${property}${rest}`;
    });

    return mappings;

  }

  private resetState() {
    this.isValid = true;
    this.isDirty = false;
    this.errors = null;
    this.showDeleteConfirmation = false;
  }

  private open() {
    this.out = false;
    setTimeout(() => this.active = true, 0);
  }

  private close() {
    this.out = true;
    setTimeout(() => this.active = this.out = false, 400);
  }

}
