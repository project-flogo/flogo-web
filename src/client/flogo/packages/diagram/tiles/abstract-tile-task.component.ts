import { Injectable, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SvgRefFixerService } from '@flogo/core';
import { DiagramSelection, TaskTile, DiagramActionSelf, DiagramActionChild, DiagramSelectionType } from '../interfaces';
import { actionEventFactory } from '../action-event-factory';

@Injectable()
export abstract class AbstractTileTaskComponent implements OnChanges {
  @Input() tile: TaskTile;
  @Input() currentSelection: DiagramSelection;
  @Input() isReadOnly = false;
  @Output() select = new EventEmitter<TaskTile>();
  @Output() branch = new EventEmitter<DiagramActionChild>();
  @Output() remove = new EventEmitter<DiagramActionSelf>();
  @Output() configure = new EventEmitter<DiagramActionSelf>();
  @HostBinding('class.is-selected') isSelected = false;

  constructor(private svgFixer: SvgRefFixerService) {
  }

  ngOnChanges({currentSelection: currentSelectionChange}: SimpleChanges) {
    if (currentSelectionChange) {
      this.checkIsSelected();
    }
  }

  @HostBinding('class.has-run')
  get hasRun() {
    const status = this.tile.task.status;
    if (status) {
      return status.executed;
    }
    return false;
  }

  @HostBinding('class.has-condition')
  get hasCondition() {
    let condition = !this.tile.task.status.isBranchConfigured;
    if (this.tile && !!this.tile.branch) {
      condition = !this.tile.branch.status.isBranchConfigured;
    }
    return condition;
  }

  @HostBinding('class.is-invalid')
  get isInvalid() {
    const status = this.tile.task.status;
    if (status) {
      return status.invalid;
    }
    return false;
  }

  onSelect(event) {
    if ((event.target.className.indexOf('js-menu-option') > -1) && !this.isReadOnly) {
      event.preventDefault();
    } else if (!this.isReadOnly) {
      this.select.emit(this.tile);
    }
  }

  onRemove() {
    this.remove.emit(actionEventFactory.remove(this.tile.task.id));
  }

  onBranch() {
    this.branch.emit(actionEventFactory.branch(this.tile.task.id));
  }

  onConfigure(taskID) {
    this.remove.emit(actionEventFactory.configure(taskID));
  }

  protected fixSvgRef(ref: string) {
    return this.svgFixer.getFixedRef(ref);
  }

  private checkIsSelected() {
    this.isSelected = false;
    if (this.currentSelection) {
      const {type, taskId} = this.currentSelection;
      this.isSelected = type === DiagramSelectionType.Node && taskId === this.tile.task.id;
    }
  }

}
