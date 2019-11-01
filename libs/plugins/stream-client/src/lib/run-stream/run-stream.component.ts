import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  ElementRef,
} from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { isEmpty } from 'lodash';

import { StreamSimulation } from '@flogo-web/core';
import { SingleEmissionSubject } from '@flogo-web/lib-client/core';

import { StreamStoreState, StreamSelectors, StreamActions } from '../core/state';
import { SimulatorService } from '../simulator';
import {
  SimulationConfigurationService,
  SimulationConfigurationComponent,
  RUNSTREAM_OPTIONS,
  FileDetails,
} from './configuration';
import { RunStreamService } from './run-stream.service';

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

  // todo - where are these 2 flags used?
  isSimulatorRunning = false;
  isSimulatorPaused = false;
  filePath: string;
  fileName: string;

  constructor(
    private store: Store<StreamStoreState>,
    private simulatorService: SimulatorService,
    private simulationConfigurationService: SimulationConfigurationService,
    private runStreamService: RunStreamService,
    private elementRef: ElementRef
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
    if (!this.filePath) {
      this.setFileUploadStatus();
    } else {
      this.openSimConfigurationPopover();
    }
  }

  openSimConfigurationPopover() {
    const connectedToRef = this.elementRef.nativeElement;
    const injectionTokens = this.createInjectorTokens();
    this.runStreamService.openPopover(
      connectedToRef,
      SimulationConfigurationComponent,
      injectionTokens
    );
  }

  private createInjectorTokens() {
    return new WeakMap<any, any>().set(RUNSTREAM_OPTIONS, {
      resourceId: this.resourceId,
      mappingType: this.simulationConfig && this.simulationConfig.inputMappingType,
      fileName: this.fileName,
      setFilePath: (fileDetails?) => this.setFilePath(fileDetails),
      startSimulation: mappingTypeSelection => this.startSimulation(mappingTypeSelection),
    });
  }

  setFileUploadStatus() {
    this.simulationConfigurationService
      .getSimulationDataPath(this.resourceId)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe((resp: FileDetails) => {
        this.setFilePath(resp);
        this.openSimConfigurationPopover();
      });
  }

  setFilePath(fileDetails: FileDetails) {
    if (!isEmpty(fileDetails)) {
      this.filePath = fileDetails.filePath;
      this.fileName = fileDetails.fileName;
    } else {
      this.filePath = '';
      this.fileName = '';
    }
  }

  startSimulation(inputMappingType) {
    this.simulatorService.start(this.resourceId, this.filePath, inputMappingType);
    this.isSimulatorRunning = true;
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
