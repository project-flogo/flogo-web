import { Injectable } from '@angular/core';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Observable } from 'rxjs';
import { switchMap, filter, map, tap } from 'rxjs/operators';
import { Action } from '@ngrx/store';

import { StreamService } from '../stream.service';
import { StreamActions, StreamActionType } from '../state';
import { SimulatorService } from '../../simulator';

@Injectable()
export class StreamSaveEffects {
  @Effect()
  saveStreamName$: Observable<Action> = this.actions$.pipe(
    ofType(StreamActionType.ChangeName),
    switchMap(() => this.streamOps.saveStreamName()),
    filter(isSaved => isSaved),
    map(() => new StreamActions.StreamSaveSuccess())
  );

  @Effect()
  saveStream$: Observable<Action> = this.actions$.pipe(
    ofType(
      StreamActionType.ChangeDescription,
      StreamActionType.DeleteStage,
      StreamActionType.UpdateMetadata,
      StreamActionType.StageItemCreated,
      StreamActionType.CommitStageConfiguration
    ),
    switchMap(action => this.saveStream(action)),
    filter(isSaved => isSaved),
    map(() => new StreamActions.StreamSaveSuccess())
  );

  @Effect()
  deleteStage$: Observable<Action> = this.actions$.pipe(
    ofType(StreamActionType.SelectRemoveStage),
    switchMap((action: StreamActions.SelectRemoveStage) =>
      this.showDeleteMessage(action.payload)
    ),
    map(removeItemId => new StreamActions.ConfirmDeleteStage(removeItemId))
  );

  @Effect()
  stopSimulation$: Observable<Action> = this.actions$.pipe(
    ofType(
      StreamActionType.StageItemCreated,
      StreamActionType.DeleteStage,
      StreamActionType.CommitStageConfiguration,
      StreamActionType.UpdateMetadata
    ),
    tap(() => {
      this.stopSimulation();
    }),
    map(() => new StreamActions.StreamSaveSuccess())
  );

  constructor(
    private streamOps: StreamService,
    private actions$: Actions,
    private simulatorService: SimulatorService
  ) {}

  private saveStream(action?: Action) {
    return this.streamOps.saveStream(action);
  }

  private showDeleteMessage(itemId) {
    return this.streamOps.getDeleteStageConfirmation(itemId);
  }

  private stopSimulation() {
    this.simulatorService.stop();
  }
}
