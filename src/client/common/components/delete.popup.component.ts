import {Component, Input, Output, EventEmitter, HostListener, HostBinding, ElementRef} from '@angular/core';

@Component({
  selector: 'flogo-delete-popover',
  moduleId: module.id,
  template: `
    <span class="flogo-icon-delete" (click)="showPopup($event)"></span>
    <div *ngIf="isPopupOpen" class="popup-container">
      <p class="popup-content">
        <span *ngIf="deleteContentType=='application'">{{ 'APP-LIST-POPUP:CONFIRM-MESSAGE-DELETE' | translate }}</span>
        <span *ngIf="deleteContentType=='flow'">{{ 'APP-DETAIL-POPUP:CONFIRM-MESSAGE-DELETE' | translate }}</span>
      </p>
      <button class="popup-btn flogo-button flogo-button--secondary" (click)="cancelDelete($event)">{{
        'APP-LIST-POPUP:DELETE-CANCEL' | translate | uppercase}}
      </button>
      <button class="popup-btn popup-btn-confirm flogo-button flogo-button--default" (click)="confirmDelete($event)">{{
        'APP-LIST-POPUP:DELETE-CONFIRM' | translate | uppercase}}
      </button>
    </div>
  `,
  styles: [`
    :host(.always-visible) {
      visibility: visible !important;
    }

    .flogo-icon-delete:hover {
      color: #79b8dc;
    }

    .popup-container {
      min-width: 340px;
      position: absolute;
      z-index: 2;
      top: 0;
      left: 30px;
      border: 1px solid #d8d8d8;
      padding: 40px;
      background: #fff;
      box-shadow: 0 8px 14px 0 rgba(0, 0, 0, 0.33);
    }
    .popup-container .popup-content {
      color: #d0021b;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 2em;
    }
    .popup-container .popup-btn {
      width: 125px;
    }
    .popup-container .popup-btn.popup-btn-confirm {
      background-color: #d0011b;
    }
  `]
})
export class FlogoDeletePopupComponent {
  @HostBinding('class.always-visible')
  isPopupOpen: boolean = false;
  @Input()
  deleteContent: any;
  @Input()
  deleteContentType: string;
  @Output()
  confirmDel: EventEmitter<any> = new EventEmitter();
  nativeElement: any;

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (event.target !== this.nativeElement && !this.nativeElement.contains(event.target)) {
      this.isPopupOpen = false;
    }
  }

  constructor(private _eref: ElementRef) {
    this.nativeElement = this._eref.nativeElement;
  }

  showPopup(event) {
    //event.stopPropagation();
    event.preventDefault();
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

}
