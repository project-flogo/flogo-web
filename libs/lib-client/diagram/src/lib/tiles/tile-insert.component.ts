import { isNil } from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

import { BUTTON_INSERT_CLASS, SELECTED_INSERT_TILE_CLASS } from '../constants';

import { DiagramSelection, InsertTile, DiagramSelectionType } from '../interfaces';

@Component({
  selector: 'flogo-diagram-tile-insert',
  templateUrl: './tile-insert.component.html',
  styleUrls: ['./tile-insert.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileInsertComponent implements OnChanges {
  @Input() tile: InsertTile;
  @Input() insertBetween: boolean;
  @Input() currentSelection: DiagramSelection;
  @Output() select = new EventEmitter<string>();
  @HostBinding('class.is-selected')
  @HostBinding(`class.${SELECTED_INSERT_TILE_CLASS}`)
  isSelected = false;
  btnInsertClass = BUTTON_INSERT_CLASS;

  get getAddActivityBtnSelector() {
    return this.insertBetween
      ? 'diagram-add-activity-between-btn'
      : 'diagram-add-activity-btn';
  }

  ngOnChanges({ currentSelection: currentSelectionChange }: SimpleChanges) {
    if (currentSelectionChange) {
      this.isSelected = this.checkIsSelected();
    }
  }

  onClick() {
    this.select.emit(this.tile.parentId);
  }

  @HostBinding('class.is-root')
  get isRootInsert() {
    return this.tile && this.tile.isRoot;
  }

  private checkIsSelected() {
    if (!this.currentSelection) {
      return false;
    }
    const { type, taskId } = this.currentSelection;
    if (type === DiagramSelectionType.Insert) {
      if (taskId) {
        return taskId === this.tile.parentId;
      } else {
        return isNil(this.tile.parentId);
      }
    }
  }
}
