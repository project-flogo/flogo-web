import {Component, Input} from '@angular/core';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'flogo-loading-indicator',
  'template': `
<div *ngIf="(active | async)" class="flogo-spin-loading-bg">
  <div class="flogo-spin-loading">
    <div>
      <div></div>
    </div>
    <div>
      <div></div>
    </div>
    <div>
      <div></div>
    </div>
    <div>
      <div></div>
    </div>
    <div>
      <div></div>
    </div>
    <div>
      <div></div>
    </div>
    <div>
      <div></div>
    </div>
    <div>
      <div></div>
    </div>
  </div>
</div>
`
})
export class LoadingIndicatorComponent {
  @Input()
  public active: Observable<any> | any;

}
