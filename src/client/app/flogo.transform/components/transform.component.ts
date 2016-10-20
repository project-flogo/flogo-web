import {Component, ViewChild, ElementRef, OnDestroy, HostListener} from '@angular/core';

import {PostService} from '../../../common/services/post.service';

import {FLOGO_TASK_ATTRIBUTE_TYPE as ATTRIBUTE_TYPE, FLOGO_TASK_TYPE as TASK_TYPE, FLOGO_ERROR_ROOT_NAME as ERROR_ROOT_NAME} from '../../../common/constants';
import {REGEX_INPUT_VALUE_INTERNAL, REGEX_INPUT_VALUE_EXTERNAL} from '../constants';
import {PUB_EVENTS, SUB_EVENTS} from '../messages';

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
  styleUrls: ['transform.component.css'],
  inputs:['flowId'],
  moduleId: module.id,
  templateUrl: 'transform.tpl.html'
})
export class TransformComponent implements OnDestroy {
  fieldsConnections:any[] = [];
  isValid:boolean;
  isDirty:boolean;
  isCollapsedOutput:boolean = true;
  isCollapsedInput:boolean = true;
  currentFieldSelected:any = {};
  flowId:string;

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

  onSelectedItem(params:any) {
    this.currentFieldSelected = params;
  }

  private raisedByThisDiagram(id:string) {
    return this.flowId === (id || '');
  }

  removeError(change:any) {
    this.errors = this.errors || {invalidMappings: {errors:[]}};
    let index = this.errors.invalidMappings.errors.findIndex(function (item:any) {
      return item.value.mapTo == change.field;
    });

    if(index !== -1) {
      this.errors.invalidMappings.errors.splice(index,1);
    }
    if(this.errors.invalidMappings.errors.length == 0) {
      this.errors = null;
    }

  }

  onToggledSchema(state:any) {
    if(state.isInput) {
      this.isCollapsedInput = state.isCollapsed;
    } else {
      this.isCollapsedOutput = state.isCollapsed;
    }
  }

  updateErrors(change:any) {
    let currentError = change.errors.invalidMappings.errors[0];
    this.errors = this.errors || {invalidMappings: {errors:[]}};

    if(change.errors.invalidMappings&&change.errors.invalidMappings.errors) {
      let index = this.errors.invalidMappings.errors.findIndex(function (item:any) {
        return item.value.mapTo == change.field;
      });

      if(index == -1) {
        this.errors.invalidMappings.errors.push(currentError);
      } else  {
        this.errors.invalidMappings.errors[index] = currentError;
      }
    }
  }

  onMappingsChange(change:any) {
    if(change.hasError) {
      this.updateErrors(change);
    } else {
      this.removeError(change);
    }

    this.fieldsConnections[change.field] = {value: change.value, mapTo: change.field, hasError: change.hasError};
    this.isValid = this.checkIsValid();
    this.isDirty = true;

    if(this.isValid) {
       this.data.result = this.getResult();
    }

  }

  getResult() {
    let results:any[] = [];

    for(var key in this.fieldsConnections) {
      if(this.fieldsConnections.hasOwnProperty(key)) {
        if(!this.fieldsConnections[key].hasError && this.fieldsConnections[key].value) {
          results.push({
            type: 1,
            mapTo: this.fieldsConnections[key].mapTo,
            value: this.fieldsConnections[key].value
          });
        }
      }
    }

    return results;
  }

  checkIsValid() {
    let hasNonEmpty:boolean = false;

    for(var key in this.fieldsConnections) {
      if(this.fieldsConnections.hasOwnProperty(key)) {
        if(this.fieldsConnections[key].hasError) {
          return  false;
        }
        if(this.fieldsConnections[key].value) {
          hasNonEmpty = true;
        }
      }
    }

    return hasNonEmpty;
  }



  saveTransform() {
    this._postService.publish(_.assign({}, PUB_EVENTS.saveTransform, {
      data: {
        tile: this.data.tile,
        inputMappings: this.transformMappingsToExternalFormat(this.data.result),
        id: this.flowId
      }
    }));
    this.close();
  }

  deleteTransform() {
    this._postService.publish(_.assign({}, PUB_EVENTS.deleteTransform, {
      data: {
        tile: this.data.tile,
        id: this.flowId
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
    if(!this.raisedByThisDiagram(data.id) ) {
      return;
    }
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
    let attributeType = ATTRIBUTE_TYPE[inputOutput.type];
    if (!attributeType) {
      attributeType = <string> (inputOutput.type || '');
      console.warn(`WARN! Unknown type: ${inputOutput.type}`);
    }

    return {
      name: inputOutput.name,
      type: attributeType.toLowerCase()
    };
  }

  private transformMappingsToExternalFormat(mappings:any[]) {
    let tileMap:any = {};
    _.forEach(this.data.precedingTiles, (tile:any) => {
      tileMap[normalizeTaskName(tile.name)] = {
        id: convertTaskID(tile.id),
        isRoot: tile.type == TASK_TYPE.TASK_ROOT,
        isError: tile.triggerType == ERROR_ROOT_NAME
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
      let path;
      if (taskInfo.isRoot) {
        path = taskInfo.isError ? `E.${property}` : `T.${property}`;
      } else {
        path = `A${taskInfo.id}.${property}`;
      }
      let rest = matches[4] || '';
      mapping.value = `{${path}}${rest}`;
    });

    return mappings;

  }

  private transformMappingsToInternalFormat(mappings:any[]) {
    let tileMap:any = {};
    _.forEach(this.data.precedingTiles, (tile:any) => {
      let tileId : any = convertTaskID(tile.id) || undefined;
      if(tile.type == TASK_TYPE.TASK_ROOT) {
        tileId = tile.triggerType == ERROR_ROOT_NAME ? ERROR_ROOT_NAME : TILE_MAP_ROOT_KEY;
      }
      tileMap[tileId] = normalizeTaskName(tile.name);
    });

    let re = REGEX_INPUT_VALUE_EXTERNAL;

    mappings.forEach(mapping => {
      let matches = re.exec(mapping.value);
      if (!matches) {
        return; // ignoring it
      }


      let taskName = tileMap[matches[2]];
      if(!taskName) {
        let type = matches[1];
        taskName = type == 'T' ? tileMap[TILE_MAP_ROOT_KEY] : tileMap[ERROR_ROOT_NAME];
      }
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
