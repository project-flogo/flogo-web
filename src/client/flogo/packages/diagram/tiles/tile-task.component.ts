import { ChangeDetectionStrategy, Component, HostBinding, OnChanges } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { AbstractTileTaskComponent } from './abstract-tile-task.component';
import { SvgRefFixerService } from '@flogo/core';

@Component({
  selector: 'flogo-diagram-tile-task',
  templateUrl: './tile-task.component.html',
  styleUrls: ['./tile-task.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [  trigger('menuOptions', [
    transition('void => *', [
      style({opacity: 0}),
      animate('100ms ease-in')
    ]),
    transition('* => void', [
      animate('100ms ease-in', style({ opacity: 0}))
    ]),
  ])]
})
export class TileTaskComponent extends AbstractTileTaskComponent implements OnChanges {
  @HostBinding('class.tile-has-branch') hasBranch = false;
  displayMenuOptions = false;
  displayMainBranchOptions = false;

  constructor(svgFixer: SvgRefFixerService) {
    super(svgFixer);
  }

  onMenuOptions() {
    this.displayMenuOptions = !this.displayMenuOptions;
  }

  closeMenuOptions() {
    this.displayMenuOptions = false;
  }

  onMainBranchOptions(event) {
    event.stopPropagation();
    this.displayMainBranchOptions = !this.displayMainBranchOptions;
  }

  closeMainBranchOptions() {
    this.displayMainBranchOptions = false;
  }

  ngOnChanges(changes) {
    super.ngOnChanges(changes);
    this.hasBranch = this.tile && !!this.tile.branch;
  }

  get bgFill() {
    if (this.hasRun) {
      return this.fixSvgRef('url(#flogo-diagram-tile__bg--has-run)');
    } else if (this.isSelected) {
      return '#4e7ead';
    } else {
      return this.fixSvgRef('url(#flogo-diagram-tile__bg)');
    }
  }

  get shadow() {
    if (this.isSelected) {
      return this.fixSvgRef('url(#flogo-diagram-tile__shadow--active)');
    } else {
      return this.fixSvgRef('url(#flogo-diagram-tile__shadow)');
    }
  }

  get isTerminal() {
    if (this.tile.isTerminalInRow) {
      return true;
    }
    const {task} = this.tile;
    if (task) {
      const {final: isFinal, canHaveChildren} = task.features;
      return isFinal || !canHaveChildren;
    }
    return false;
  }

  get errorMsg() {
    const status = this.tile.task.status;
    if (status && status.executionErrored) {
      const [error] = status.executionErrored;
      return error;
    }
    return null;
  }

}
