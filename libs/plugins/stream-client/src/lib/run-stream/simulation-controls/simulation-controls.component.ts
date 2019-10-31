import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { StreamSimulation } from '@flogo-web/core';

@Component({
  selector: 'flogo-stream-simulation-controls',
  templateUrl: './simulation-controls.component.html',
  styleUrls: ['./simulation-controls.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationControlsComponent {
  readonly statuses = StreamSimulation.ProcessStatus;
  @Input() status: StreamSimulation.ProcessStatus;
  @Input() disabled = false;
  @Input() disableRunStream: boolean;
  @Output() open = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() resume = new EventEmitter<void>();
  @Output() stop = new EventEmitter<void>();
}
