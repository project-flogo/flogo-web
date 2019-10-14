import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  HostBinding,
} from '@angular/core';
import { FlowResource } from '../../core/interfaces';

@Component({
  selector: 'flogo-flow-flows-list',
  templateUrl: 'flows-list.component.html',
  styleUrls: ['flows-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsListComponent {
  @Input() flows: FlowResource[];
  @Output() flowSelected = new EventEmitter<FlowResource>();
  @Output() flowSelectionCancel = new EventEmitter<void>();

  @HostBinding('class.is-empty')
  get isEmpty() {
    return !this.flows || this.flows.length <= 0;
  }

  selectFlow(flow: FlowResource) {
    this.flowSelected.emit(flow);
  }
}
