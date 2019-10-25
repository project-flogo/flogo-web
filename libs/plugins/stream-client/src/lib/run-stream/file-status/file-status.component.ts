import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FileStatus } from './file-status';

@Component({
  selector: 'flogo-stream-file-status',
  templateUrl: './file-status.component.html',
  styleUrls: ['./file-status.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileStatusComponent {
  @Input() status: FileStatus;
  @Input() isDragging: boolean;
  @Output() remove: EventEmitter<void> = new EventEmitter();

  @HostListener('click')
  removeFile() {
    if (this.status === FileStatus.Uploaded) {
      this.remove.emit();
    }
  }
}
