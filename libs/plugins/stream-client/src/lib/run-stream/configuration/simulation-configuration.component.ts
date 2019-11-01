import { Component, Inject, InjectionToken, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { SingleEmissionSubject } from '@flogo-web/lib-client/core';
import { SelectEvent } from '@flogo-web/lib-client/select';
import { StreamSimulation } from '@flogo-web/core';

import { FileStatus } from '../file-status';
import { SimulationConfigurationService } from './simulation-configuration.service';
import InputMappingType = StreamSimulation.InputMappingType;

const DEFAULT_MAPPING_TYPE = InputMappingType.SingleInput;
const isValidMappingType = (val: any): val is InputMappingType =>
  !!val && Object.values(InputMappingType).includes(val);

export const RUNSTREAM_OPTIONS = new InjectionToken<any>('flogo-stream-run-stream');

export interface FileDetails {
  fileName: string;
  filePath: string;
}

@Component({
  selector: 'flogo-stream-simulation-configuration',
  templateUrl: 'simulation-configuration.component.html',
  styleUrls: ['simulation-configuration.component.less'],
})
export class SimulationConfigurationComponent implements OnInit, OnDestroy {
  readonly InputMappingType = InputMappingType;
  readonly FileStatus = FileStatus;
  fileName: string;
  fileUploadStatus: FileStatus;
  mappingType: InputMappingType;

  isDragging: boolean;
  disableRunStream: boolean;
  mappingTypeSelection: InputMappingType = DEFAULT_MAPPING_TYPE;
  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(
    private simulationConfigurationService: SimulationConfigurationService,
    @Inject(RUNSTREAM_OPTIONS) public control
  ) {}

  ngOnInit(): void {
    this.fileName = this.control.fileName;
    this.mappingTypeSelection = isValidMappingType(this.control.mappingType)
      ? this.control.mappingType
      : DEFAULT_MAPPING_TYPE;
    if (this.fileName) {
      this.setFileName(this.fileName);
      this.setFileStatus(FileStatus.Uploaded, false);
    } else {
      this.setFileStatus(FileStatus.Empty, true);
    }
  }

  onChangeMappingType({ value: mappingType }: SelectEvent<InputMappingType>) {
    this.mappingTypeSelection = mappingType;
  }

  setFileName(fileName) {
    if (fileName.includes(this.control.resourceId)) {
      this.fileName = fileName.substring(this.control.resourceId.length + 1);
    }
  }

  uploadFile(files: FileList) {
    const fileToUpload = files.item(0);
    const formData = new FormData();
    formData.append(`${this.control.resourceId}-${fileToUpload.name}`, fileToUpload);
    formData.append('resourceId', this.control.resourceId);
    this.fileUploadStatus = FileStatus.Uploading;
    this.simulationConfigurationService
      .uploadSimulationDataFile(formData)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(
        (resp: FileDetails) => {
          this.control.setFilePath(resp);
          this.setFileName(resp.fileName);
          this.setFileStatus(FileStatus.Uploaded, false);
        },
        () => {
          this.setFileStatus(FileStatus.Errored, true);
          this.fileName = 'Error.....try again';
        }
      );
  }

  runSimulation() {
    this.control.startSimulation(this.mappingTypeSelection);
  }

  removeFile() {
    this.simulationConfigurationService
      .removeSimulationDataFile(this.control.resourceId)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe(() => {
        this.control.setFilePath();
        this.fileName = '';
        this.setFileStatus(FileStatus.Empty, true);
      });
  }

  setFileStatus(fileUploadStatus, disableRunStream) {
    this.fileUploadStatus = fileUploadStatus;
    this.disableRunStream = disableRunStream;
  }

  setIsDragging(isDragging: boolean) {
    this.isDragging = isDragging;
  }

  ngOnDestroy(): void {
    this.ngOnDestroy$.emitAndComplete();
  }
}
