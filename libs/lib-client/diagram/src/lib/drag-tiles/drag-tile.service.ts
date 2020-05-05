import { groupBy } from 'lodash';
import { Injectable } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { NodeType } from '@flogo-web/lib-client/core';

import { TaskTile, Tile, TileType } from '../interfaces';
import { DropActionData, TilesGroupedByZone } from './interface';

/* The following enum is based on the return value of MouseEvent.buttons as described in
    https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
 */
enum MouseButtonPressed {
  NO_BUTTON,
  PRIMARY_BUTTON,
}

export enum DragTilePosition {
  OUTSIDE,
  INSIDE,
}

@Injectable()
export class DragTileService {
  private rowAllParents: Map<number, string[]>;
  private isDragInsideContainer = false;

  groupTilesByZone(allTiles: Tile[]): TilesGroupedByZone {
    const { preDropZone, dropZone, postDropZone } = groupBy(allTiles, (tile: Tile) => {
      switch (tile.type) {
        case TileType.Padding:
          return 'preDropZone';
        case TileType.Task: {
          const { task } = tile as TaskTile;
          if (task.type === NodeType.Branch) {
            return 'preDropZone';
          } else if (task?.features?.canHaveChildren) {
            return 'dropZone';
          }
          return 'postDropZone';
        }
        case TileType.Insert:
        case TileType.Placeholder:
          return 'postDropZone';
      }
    });
    return {
      preDropZone: preDropZone || [],
      dropZone: dropZone || [],
      postDropZone: postDropZone || [],
    };
  }

  prepareDropActionData(
    dropEvent: CdkDragDrop<Tile[]>,
    getBranchId?: () => string
  ): DropActionData {
    const { previousIndex, currentIndex, item, container, previousContainer } = dropEvent;

    if (!this.isDragInsideContainer) {
      return;
    }

    this.resetDraggingTracker();

    if (previousContainer === container && previousIndex === currentIndex) {
      /* Returning if the item is dropped in it's original place */
      return;
    }

    const taskTilesInContainer = container.getSortedItems();
    let parentId: string = null;

    if (currentIndex > 0) {
      if (previousContainer === container && currentIndex > previousIndex) {
        parentId = taskTilesInContainer[currentIndex]?.data;
      } else {
        parentId = taskTilesInContainer[currentIndex - 1]?.data;
      }
    } else if (getBranchId) {
      /* When the tile is dropped at the first place of a non-zero indexed row then
         the parent of the tile will be the branch tile in this row and calculated
         by consumer */
      parentId = getBranchId();
    }
    return {
      itemId: item.data,
      parentId,
    };
  }

  updateRowParents(tileMatrix, getRowIndex: (tileId: string) => number) {
    this.rowAllParents = new Map<number, string[]>();
    const rowParentMap = new Map<number, string>();
    const totalRows = tileMatrix.length;
    tileMatrix.forEach((row, index) => {
      const rowIndex = totalRows - index - 1;
      const branchTask = row.find(tile => {
        return tile?.task?.type === NodeType.Branch;
      });
      if (branchTask) {
        rowParentMap.set(rowIndex, branchTask.task.parents[0]);
      }
    });
    rowParentMap.forEach((rowParent, rowIndex) => {
      this.rowAllParents.set(
        rowIndex,
        this.getRowAllParents(rowParent, rowParentMap, getRowIndex)
      );
    });
  }

  isTileAllowedToDropInRow(tileId, rowIndex) {
    const rowParents = this.rowAllParents.get(rowIndex);
    return !rowParents?.length || !rowParents.includes(tileId);
  }

  changeDraggingTracker(position: DragTilePosition, buttonsActive: MouseButtonPressed) {
    if (buttonsActive === MouseButtonPressed.PRIMARY_BUTTON) {
      switch (position) {
        case DragTilePosition.INSIDE:
          this.isDragInsideContainer = true;
          break;
        case DragTilePosition.OUTSIDE:
        default:
          this.resetDraggingTracker();
      }
    }
  }

  private getRowAllParents(parentTile, rowParents, getRowIndex) {
    const allParentTiles = [];
    while (parentTile) {
      allParentTiles.push(parentTile);
      const parentRowIndex = getRowIndex(parentTile);
      parentTile = rowParents.get(parentRowIndex);
    }
    return allParentTiles;
  }

  private resetDraggingTracker() {
    this.isDragInsideContainer = false;
  }
}
