import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { SingleEmissionSubject } from '@flogo-web/lib-client/core';
import { StreamSimulation } from '@flogo-web/core';

import { FileStatus } from '../file-status';
import { SimulationConfigurationService } from './simulation-configuration.service';

@Component({
  selector: 'flogo-stream-simulation-configuration',
  templateUrl: 'simulation-configuration.component.html',
  styleUrls: ['simulation-configuration.component.less'],
})
export class SimulationConfigurationComponent implements OnChanges, OnDestroy {
  @Input() resourceId: string;
  @Input() fileName: string;
  @Input() fileUploadStatus: FileStatus;
  @Input() mappingType: StreamSimulation.InputMappingType;
  @Output() setFilePath: EventEmitter<object> = new EventEmitter<object>();
  @Output() startSimulation: EventEmitter<any> = new EventEmitter();

  disableRunStream = true;
  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(private runStreamService: SimulationConfigurationService) {}

  ngOnChanges({ fileName }: SimpleChanges): void {
    if (fileName && fileName.currentValue) {
      this.setFileName(fileName.currentValue);
      this.disableRunStream = false;
    }
  }

  setFileName(fileName) {
    if (fileName.includes(this.resourceId)) {
      this.fileName = fileName.substring(this.resourceId.length + 1);
    }
  }

  uploadFile(files: FileList) {
    const fileToUpload = files.item(0);
    const formData = new FormData();
    formData.append(`${this.resourceId}-${fileToUpload.name}`, fileToUpload);
    this.fileUploadStatus = FileStatus.Uploading;
    this.runStreamService
      .uploadSimulationDataFile(formData)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(
        (resp: object) => {
          this.setFilePath.emit(resp);
          this.fileUploadStatus = FileStatus.Uploaded;
          this.disableRunStream = false;
        },
        () => {
          this.fileUploadStatus = FileStatus.Errored;
          this.disableRunStream = true;
          this.fileName = 'Error.....try again';
        }
      );
  }

  runSimulation() {
    this.startSimulation.emit(
      this.mappingType || StreamSimulation.InputMappingType.SingleInput
    );
  }

  removeFile() {
    this.runStreamService
      .removeSimulationDataFile(this.resourceId)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(() => {
        this.setFilePath.emit();
      });
  }

  ngOnDestroy(): void {
    this.ngOnDestroy$.emitAndComplete();
  }
}
