import {Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import { FlogoModal } from '../../../common/services/modal.service';
import {IFlogoApplicationFlowModel as FlowModel} from '../../../common/application.model';

@Component({
  selector: 'flogo-apps-flows',
  moduleId: module.id,
  templateUrl: 'flows.tpl.html',
  styleUrls: ['flows.component.css']
})
export class FlogoApplicationFlowsComponent implements OnChanges{
  @Input()
  public flows: Array<FlowModel> = [];
  @Output()
  public flowSelected: EventEmitter<FlowModel> = new EventEmitter<FlowModel>();
  @Output()
  public deleteFlow: EventEmitter<FlowModel> = new EventEmitter<FlowModel>();

  constructor(public translate: TranslateService, public flogoModal: FlogoModal) {
  }

  ngOnChanges(changes:SimpleChanges){
    this.flows = _.sortBy(this.flows, flow => flow.name.toLowerCase());
  }

  trackByFlowId(index: number, flow: FlowModel) {
    return flow ? flow.id : null;
  }

  onSelect(event: Event, removeBox: ElementRef, flow: FlowModel) {
    if (!(event.target === removeBox.nativeElement || removeBox.nativeElement.contains(event.target))) {
      this.flowSelected.emit(flow);
    }
  }

  onDeleteFlow(flow: FlowModel) {
    this.deleteFlow.emit(flow);
  }
}
