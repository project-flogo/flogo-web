import { Component, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { DiagramGraph, SingleEmissionSubject } from '@flogo-web/lib-client/core';
import {
  DiagramAction,
  DiagramActionType,
  DiagramSelection,
  DiagramActionSelf,
  Tile,
  TaskTile,
  TileType,
  trackTileByFn,
  InsertTile,
  DragTileService,
  DragTilePosition,
} from '@flogo-web/lib-client/diagram';

import {
  StreamStoreState,
  selectGraph,
  StreamActions,
  getDiagramSelection,
  getStagesAsTiles,
} from '../core/state';
const MAX_TILES = 10;
@Component({
  selector: 'flogo-stream-diagram',
  templateUrl: './stream-diagram.component.html',
  styleUrls: ['./stream-diagram.component.less'],
})
export class StreamDiagramComponent implements OnDestroy {
  items$: Observable<DiagramGraph>;
  currentSelection: DiagramSelection;
  tiles: Tile[];
  // by default should be the root tile
  insertTile: InsertTile;
  draggingPosition = DragTilePosition;
  trackTileBy = trackTileByFn;
  availableSlots: number;
  placeholders = [];
  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(
    private store: Store<StreamStoreState>,
    private dragService: DragTileService
  ) {
    this.items$ = this.store.pipe(select(selectGraph), takeUntil(this.ngOnDestroy$));
    this.store
      .pipe(select(getDiagramSelection), takeUntil(this.ngOnDestroy$))
      .subscribe(currentSelection => {
        this.currentSelection = currentSelection;
      });

    this.store
      .pipe(select(getStagesAsTiles(MAX_TILES)), takeUntil(this.ngOnDestroy$))
      .subscribe((streamTiles: TaskTile[]) => {
        this.tiles = streamTiles;
        const lastTile = streamTiles[streamTiles.length - 1];
        this.insertTile = {
          type: TileType.Insert,
          parentId: lastTile ? lastTile.task.id : null,
          isRoot: !lastTile,
        };
        this.updateAvailableSlots(streamTiles);
      });
  }

  ngOnDestroy(): void {
    this.ngOnDestroy$.emitAndComplete();
  }

  onDiagramAction(action: DiagramAction) {
    switch (action.type) {
      case DiagramActionType.Remove:
        this.store.dispatch(
          new StreamActions.SelectRemoveStage((<DiagramActionSelf>action).id)
        );
        break;
      case DiagramActionType.Configure:
        this.store.dispatch(
          new StreamActions.ConfigureStage({
            itemId: (<DiagramActionSelf>action).id,
          })
        );
        break;
    }
  }
  addStage() {
    this.store.dispatch(new StreamActions.SelectCreateStage(this.insertTile.parentId));
  }
  selectStage(taskTile: TaskTile) {
    this.store.dispatch(new StreamActions.SelectStage(taskTile.task.id));
  }

  moveStage(event: CdkDragDrop<Tile[]>) {
    const dropActionData = this.dragService.prepareDropActionData(event);
    if (dropActionData) {
      this.store.dispatch(new StreamActions.MoveStage(dropActionData));
    }
  }

  updateDraggingState(pos: DragTilePosition, buttons: number) {
    this.dragService.changeDraggingTracker(pos, buttons);
  }

  private updateAvailableSlots(streamTiles) {
    this.availableSlots = MAX_TILES - streamTiles.length;
    if (this.availableSlots) {
      const visiblePlaceholdersCount = this.availableSlots - 1;
      this.placeholders = new Array(visiblePlaceholdersCount);
    }
  }
}
