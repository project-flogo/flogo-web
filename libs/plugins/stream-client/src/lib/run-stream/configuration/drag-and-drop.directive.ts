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
  @Output() fileDropped = new EventEmitter<FileList>();
  @Output() dragging = new EventEmitter<boolean>();

  @HostBinding('style.background') background;
  @HostBinding('style.border') border;
  @HostBinding('style.opacity') opacity = 1;

  @HostListener('dragover', ['$event']) public onDragOver(event) {
    this.preventStopEvent(event);
    this.draggingStarted();
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(event) {
    this.preventStopEvent(event);
    this.draggingFinished();
  }

  @HostListener('drop', ['$event']) public onDrop(event) {
    this.preventStopEvent(event);
    const files = event.dataTransfer.files;
    this.draggingFinished();
    if (files.length > 0) {
      this.fileDropped.emit(files);
    }
  }

  ngOnChanges({ status }: SimpleChanges): void {
    if (status && !status.firstChange) {
      // todo: remove this from here this is a drag and drop directive but the following lines are uploading logic!
      if (status.currentValue === FileStatus.Uploading) {
        this.opacity = 0.2;
      } else {
        this.opacity = 1;
      }
    }
  }

  preventStopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  private draggingStarted() {
    this.background = 'rgba(224, 240, 249, 0.35)';
    this.border = '2px dashed #2694d3';
    this.dragging.emit(true);
  }

  private draggingFinished() {
    this.background = null;
    this.border = null;
    this.dragging.emit(false);
  }
}
