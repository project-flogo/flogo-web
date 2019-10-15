import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { LocalSearch } from '@flogo-web/lib-client/search';
import { FlowResource } from '../../core/interfaces';
import { SubflowConfig } from '../subflow-config';

@Component({
  selector: 'flogo-flow-task-configurator-subflow',
  templateUrl: 'subflow.component.html',
  styleUrls: ['subflow.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubFlowComponent implements OnChanges {
  @Input() showFlowSelection = false;
  @Input() subflow: SubflowConfig;
  @Input() flowsList: FlowResource[];
  @Output() startSelection = new EventEmitter<void>();
  @Output() cancelSelection = new EventEmitter<void>();
  @Output() selectDifferentFlow = new EventEmitter<FlowResource>();

  searcher = new LocalSearch<FlowResource>({ matchFields: ['name', 'description'] });
  subflows$ = this.searcher.list$;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.flowsList) {
      this.searcher.setSourceList(this.flowsList);
    }
  }

  selectFlow() {
    this.startSelection.emit();
  }

  subflowChanged(resource: FlowResource) {
    this.selectDifferentFlow.emit(resource);
  }

  selectionCancel() {
    this.cancelSelection.emit();
  }

  filter(query: string) {
    this.searcher.search(query);
  }
}
