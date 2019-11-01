import { Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { isEmpty } from 'lodash';

import { StreamSimulation } from '@flogo-web/core';
import { SingleEmissionSubject } from '@flogo-web/lib-client/core';

import { StreamStoreState, StreamSelectors, StreamActions } from '../core/state';
import { SimulatorService } from '../simulator';
import { FileStatus } from './file-status';
import { SimulationConfigurationService } from './configuration';

@Component({
  selector: 'flogo-stream-run-stream',
  templateUrl: 'run-stream.component.html',
  styleUrls: [],
})
export class RunStreamComponent implements OnInit, OnDestroy {
  @Output() simulationStarted: EventEmitter<void> = new EventEmitter();

  private ngOnDestroy$ = SingleEmissionSubject.create();
  simulatorStatus$: Observable<StreamSimulation.ProcessStatus>;
  resourceId: string;
  disableRunStream: boolean;
  simulationConfig: StreamSimulation.SimulationConfig;

  showConfiguration = false;
  // todo - where are these 2 flags used?
  isSimulatorRunning = false;
  isSimulatorPaused = false;
  filePath: string;
  fileName: string;
  fileUploadStatus = FileStatus.Empty;

  constructor(
    private store: Store<StreamStoreState>,
    private simulatorService: SimulatorService,
    private runStreamService: SimulationConfigurationService
  ) {}

  ngOnInit(): void {
    this.simulatorStatus$ = this.simulatorService.status$;
    this.store
      .pipe(
        select(StreamSelectors.getSimulationDetails),
        distinctUntilChanged(),
        takeUntil(this.ngOnDestroy$)
      )
      .subscribe(details => {
        this.resourceId = details.resourceId;
        this.disableRunStream = details.disableRunStream;
        this.simulationConfig = details.simulation;
      });
  }

  openConfiguration() {
    if (!this.filePath && !this.showConfiguration) {
      this.setFileUploadStatus();
    }
    this.showConfiguration = !this.showConfiguration;
  }

  setFileUploadStatus() {
    this.runStreamService
      .getSimulationDataPath(this.resourceId)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe((resp: any) => {
        this.setFilePath(resp);
      });
  }

  setFilePath(fileDetails) {
    if (!isEmpty(fileDetails)) {
      this.filePath = fileDetails.filePath;
      this.fileName = fileDetails.fileName;
      this.fileUploadStatus = FileStatus.Uploaded;
    } else {
      this.filePath = '';
      this.fileName = '';
      this.fileUploadStatus = FileStatus.Empty;
    }
  }

  startSimulation(inputMappingType) {
    this.simulatorService.start(this.resourceId, this.filePath, inputMappingType);
    this.isSimulatorRunning = true;
    this.showConfiguration = false;
    this.store.dispatch(
      new StreamActions.SimulatorConfigurationChange({ inputMappingType })
    );
    this.simulationStarted.emit();
  }

  stopSimulation() {
    this.simulatorService.stop();
    this.isSimulatorRunning = true;
  }

  pauseSimulation() {
    this.simulatorService.pause();
    this.isSimulatorPaused = true;
  }

  resumeSimulation() {
    this.simulatorService.resume();
    this.isSimulatorPaused = false;
  }

  ngOnDestroy() {
    this.ngOnDestroy$.emitAndComplete();
  }
}
