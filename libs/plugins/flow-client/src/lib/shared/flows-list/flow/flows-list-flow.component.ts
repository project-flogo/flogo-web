import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FlowResource } from '../../../core/interfaces';

@Component({
  selector: 'flogo-flow-flows-list-flow',
  templateUrl: './flows-list-flow.component.html',
  styleUrls: ['./flows-list-flow.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsListFlowComponent {
  @Input() flow: FlowResource;
  @Output() select = new EventEmitter<FlowResource>();
}
