import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChange,
} from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { SingleEmissionSubject } from '@flogo-web/lib-client/core';
import { SelectEvent } from '@flogo-web/lib-client/select';
import { StreamSimulation } from '@flogo-web/core';
import InputMappingType = StreamSimulation.InputMappingType;

import { FileStatus } from '../file-status';
import { SimulationConfigurationService } from './simulation-configuration.service';

const DEFAULT_MAPPING_TYPE = InputMappingType.SingleInput;
const isValidMappingType = (val: any): val is InputMappingType =>
  !!val && Object.values(InputMappingType).includes(val);

@Component({
  selector: 'flogo-stream-simulation-configuration',
  templateUrl: 'simulation-configuration.component.html',
  styleUrls: ['simulation-configuration.component.less'],
})
export class SimulationConfigurationComponent implements OnChanges, OnDestroy {
  readonly InputMappingType = InputMappingType;
  readonly FileStatus = FileStatus;
  @Input() resourceId: string;
  @Input() fileName: string;
  @Input() fileUploadStatus: FileStatus;
  @Input() mappingType?: InputMappingType;
  @Output() setFilePath: EventEmitter<object> = new EventEmitter<object>();
  @Output() startSimulation: EventEmitter<InputMappingType> = new EventEmitter();

  isDragging: boolean;
  disableRunStream = true;
  mappingTypeSelection: InputMappingType = DEFAULT_MAPPING_TYPE;
  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(private runStreamService: SimulationConfigurationService) {}

  ngOnChanges({ fileName, mappingType }: { [key in keyof this]?: SimpleChange }): void {
    if (fileName && fileName.currentValue) {
      this.setFileName(fileName.currentValue);
      this.disableRunStream = false;
    }
    if (mappingType && this.mappingType !== this.mappingTypeSelection) {
      this.mappingTypeSelection = isValidMappingType(this.mappingType)
        ? this.mappingType
        : DEFAULT_MAPPING_TYPE;
    }
  }

  onChangeMappingType({ value: mappingType }: SelectEvent<InputMappingType>) {
    this.mappingTypeSelection = mappingType;
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
    formData.append('resourceId', this.resourceId);
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
    this.startSimulation.emit(this.mappingTypeSelection);
  }

  removeFile() {
    this.runStreamService
      .removeSimulationDataFile(this.resourceId)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(() => {
        this.setFilePath.emit();
      });
  }

  setIsDragging(isDragging: boolean) {
    this.isDragging = isDragging;
  }

  ngOnDestroy(): void {
    this.ngOnDestroy$.emitAndComplete();
  }
}
