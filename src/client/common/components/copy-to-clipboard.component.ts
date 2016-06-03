import { Component, Input } from '@angular/core';
import { copyToClipboard } from '../utils';

@Component({
  selector: 'flogo-copy-to-clipboard',
  template: `<button class="tc-buttons tc-buttons-primary-call flogo-clipboard-button"
        (click)="copy()" [ngClass]="{disabled: copied}" >{{ text }}</button>`
})
export class CopyToClipboardComponent {
  @Input() element : HTMLElement;
  copied = false;

  copy() {
    if(copyToClipboard(this.element)) {
      this.copied = true;
      setTimeout(() => this.copied = false, 1200);
    }
  }

  get text() {
    return this.copied ? 'Copied to clipboard' : 'Copy';
  }

}
