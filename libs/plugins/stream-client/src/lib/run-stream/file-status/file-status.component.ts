import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FileStatus } from './file-status';

@Component({
  selector: 'flogo-stream-file-status',
  templateUrl: './file-status.component.html',
  styleUrls: ['./file-status.component.less'],
})
export class FileStatusComponent {
  @Input() status: FileStatus;
  @Output() remove: EventEmitter<void> = new EventEmitter();
  constructor() {}

  removeFile() {
    if (this.status === FileStatus.Uploaded) {
      this.status = FileStatus.Empty;
      this.remove.emit();
    }
  }
}
