import {
  Directive,
  HostListener,
  HostBinding,
  EventEmitter,
  Output,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FileStatus } from '../file-status';

@Directive({
  selector: '[fgDragDropFile]',
})
export class DragAndDropDirective implements OnChanges {
  @Input() status;
  @Output() fileDropped: EventEmitter<FileList> = new EventEmitter<FileList>();

  @HostBinding('style.background') private background;
  @HostBinding('style.border') private border = '2px dotted #b6b6b6';
  @HostBinding('style.opacity') private opacity = 1;

  @HostListener('dragover', ['$event']) public onDragOver(event) {
    this.preventStopEvent(event);
    this.background = 'rgba(224, 240, 249, 0.35)';
    this.border = '2px dotted #2694d3';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(event) {
    this.preventStopEvent(event);
    this.background = '#fafafa';
    this.border = '2px dotted #b6b6b6';
  }

  @HostListener('drop', ['$event']) public onDrop(event) {
    this.preventStopEvent(event);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      this.background = '#fafafa';
      this.border = '2px dotted #b6b6b6';
      this.fileDropped.emit(files);
    }
  }

  ngOnChanges({ status }: SimpleChanges): void {
    if (status && !status.firstChange) {
      if (status.currentValue === FileStatus.Uploading) {
        this.opacity = 0.2;
      } else {
        this.opacity = 1;
      }

      if (status.currentValue === FileStatus.Uploaded || FileStatus.Errored) {
        this.border = 'none';
      }
    }
  }

  preventStopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }
}
