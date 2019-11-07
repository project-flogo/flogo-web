import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  Inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

// leave out some margin
const POPOVER_WIDTH = 344 + 10;

@Component({
  selector: 'flogo-delete-popover',
  template: `
    <span
      class="flogo-icon-delete"
      (click)="showPopup($event)"
      data-testid="apps-list-delete-icon"
    ></span>
    <div
      *ngIf="isPopupOpen"
      class="popup-container"
      [class.popup-container--left]="showLeft"
      [style.width]="width + 'px'"
      data-testid="apps-list-delete-popover"
    >
      <p class="popup-content">
        <span>{{ i18nMessage | translate }}</span>
      </p>
      <button
        class="flogo-button--secondary"
        (click)="cancelDelete($event)"
        data-testid="apps-list-delete-popover-cancel"
      >
        {{ 'APP-LIST-POPUP:DELETE-CANCEL' | translate }}
      </button>
      <button
        class="popup-btn-confirm flogo-button--default"
        (click)="confirmDelete($event)"
        data-testid="apps-list-delete-popover-delete"
      >
        {{ 'APP-LIST-POPUP:DELETE-CONFIRM' | translate }}
      </button>
    </div>
  `,
  styles: [
    `
      :host(.always-visible) {
        visibility: visible !important;
      }

      .flogo-icon-delete:hover {
        color: #79b8dc;
      }

      .popup-container {
        position: absolute;
        z-index: 2;
        top: 0;
        left: 30px;
        border: 1px solid #d8d8d8;
        padding: 40px;
        background: #fff;
        box-shadow: 0 8px 14px 0 rgba(0, 0, 0, 0.33);
      }

      .popup-container--left {
        left: unset;
        right: 30px;
      }

      .popup-container .popup-content {
        color: #d0021b;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 2em;
      }
      .popup-container .popup-btn-confirm {
        background-color: #d0011b;
        border-color: #d0011b;
      }
    `,
  ],
})
export class FlogoDeletePopupComponent {
  readonly width = POPOVER_WIDTH;
  @HostBinding('class.always-visible') isPopupOpen = false;
  @Input() deleteContent: any;
  @Input() i18nMessage: string;
  @Output() confirmDel: EventEmitter<any> = new EventEmitter();
  showLeft: boolean;
  private nativeElement: any;

  constructor(elementRef: ElementRef, @Inject(DOCUMENT) private document) {
    this.nativeElement = elementRef.nativeElement;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (
      event.target !== this.nativeElement &&
      !this.nativeElement.contains(event.target)
    ) {
      this.isPopupOpen = false;
    }
  }

  showPopup(event) {
    event.preventDefault();
    this.showLeft = !this.willItFitInViewport();
    this.isPopupOpen = true;
  }

  confirmDelete(event) {
    event.stopPropagation();
    this.confirmDel.emit(this.deleteContent);
  }

  cancelDelete(event) {
    event.stopPropagation();
    this.isPopupOpen = false;
  }

  private willItFitInViewport() {
    const minWidth = this.nativeElement.getBoundingClientRect().right + POPOVER_WIDTH;
    return minWidth < this.document.body.clientWidth;
  }
}
