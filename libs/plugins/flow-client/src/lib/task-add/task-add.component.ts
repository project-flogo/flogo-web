import {
  Component,
  Inject,
  InjectionToken,
  OnInit,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { Observable, ReplaySubject } from 'rxjs';

import { CONTRIB_REFS } from '@flogo-web/core';
import { FlogoInstallerComponent } from '@flogo-web/lib-client/contrib-installer';

import { filterActivitiesBy } from './core/filter-activities-by';
import { Activity, TaskAddOptions } from './core/task-add-options';
import { ModalService } from '@flogo-web/lib-client/modal';
import { delay, take, switchMap, filter } from 'rxjs/operators';
import { SubflowSelectionParams, SubFlowComponent } from '../sub-flow';

export const TASKADD_OPTIONS = new InjectionToken<TaskAddOptions>('flogo-flow-task-add');

@Component({
  templateUrl: 'task-add.component.html',
  styleUrls: ['task-add.component.less'],
})
export class TaskAddComponent implements OnInit, AfterViewInit {
  filteredActivities$: Observable<Activity[]>;
  filterText$: ReplaySubject<string>;
  isInstallOpen = false;
  isSubflowOpen = false;

  constructor(
    @Inject(TASKADD_OPTIONS) public params: TaskAddOptions,
    private modalService: ModalService,
    private elementRef: ElementRef,
    private focusTrap: FocusTrapFactory
  ) {
    this.filterText$ = new ReplaySubject<string>(1);
  }

  ngAfterViewInit() {
    const focusTrap = this.focusTrap.create(this.elementRef.nativeElement);
    focusTrap.focusInitialElement();
  }

  ngOnInit() {
    this.filteredActivities$ = filterActivitiesBy(
      this.params.activities$,
      this.filterText$
    );
    this.filterText$.next('');
  }

  filterActivities(term: string) {
    this.filterText$.next(term);
  }

  selectActivity(ref: string) {
    if (ref === CONTRIB_REFS.SUBFLOW) {
      this.openSubflowSelector();
    } else {
      this.params.selectActivity(ref);
    }
  }

  handleInstallerWindow(state: boolean) {
    this.isInstallOpen = true;
    if (state) {
      this.modalService
        .openModal<void>(FlogoInstallerComponent)
        .detach.pipe(delay(100))
        .subscribe(() => {
          this.isInstallOpen = false;
          this.updateWindowState();
        });
    }
    this.updateWindowState();
  }

  @HostListener('keyup.escape')
  cancel() {
    this.params.cancel();
  }

  private openSubflowSelector() {
    this.isSubflowOpen = true;
    this.updateWindowState();
    this.params.appAndFlowInfo$
      .pipe(
        take(1),
        switchMap(({ actionId, appId }) => {
          return this.modalService.openModal<SubflowSelectionParams>(SubFlowComponent, {
            currentFlowId: actionId,
            appId,
          }).result;
        }),
        filter(flow => !!flow)
      )
      .subscribe(
        flow => this.params.selectActivity(CONTRIB_REFS.SUBFLOW, flow),
        null,
        () => {
          this.isSubflowOpen = false;
          this.updateWindowState();
        }
      );
  }

  private updateWindowState() {
    this.params.updateActiveState(this.isInstallOpen || this.isSubflowOpen);
  }
}
