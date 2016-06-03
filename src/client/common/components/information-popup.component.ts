import {Component, Input, ElementRef, HostBinding, HostListener} from '@angular/core';

@Component({
  selector: 'flogo-information-popup',
  template: `
    <button (click)="open($event)" class="{{ btnClasses }}">{{ btnText }}</button>
    <div class="flogo-information-popup__popup"><ng-content select="flogo-information-popup-content"></ng-content></div>
  `,
  styles: [`
  :host {
    display: inline-block;
    position: relative;
  }
  
  .flogo-information-popup__popup {
    color: #fff;
    visibility: hidden;
    margin-top: 17px;
    position: absolute;
    left: -125%;
    top: 100%;
    width: 400px;
    
    background-color: #0081cb;
    border-radius: 4px;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
    padding: 20px;
    
    pointer-events: none;
    
    transition: all .2s ease-in-out;
    opacity: 0;
    transform: translateY(-20px);
    
  }
  
  .flogo-information-popup__popup:after {
    border-left: solid transparent 15px;
    border-right: solid transparent 15px;
    border-bottom: solid #0081cb 14px;
    top: -14px;
    content: " ";
    height: 0;
    left: 50%;
    margin-left: -13px;
    position: absolute;
    width: 0;
  }
  
  :host(.is-open) .flogo-information-popup__popup {
     pointer-events: auto;
     opacity: 1;
     transform: translateY(0%);
     visibility: visible; 
  }
  `]
})
export class InformationPopupComponent {

  @HostBinding('class.is-open')
  isOpen:boolean = false;

  @Input() btnClasses : any;
  @Input() btnText : any;


  constructor(private _eref:ElementRef) {
  }

  open(event:Event) {
    this.isOpen = true;
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  onClick(event:Event) {
    let nativeElement = this._eref.nativeElement;
    if (event.target !== nativeElement && !nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }


}
