import { snakeCase } from 'lodash';
import { differenceInSeconds } from 'date-fns';

import {
  Component,
  Input,
  Output,
  SimpleChanges,
  OnChanges,
  OnInit,
  EventEmitter,
} from '@angular/core';
import { Observable, of as observableOf, combineLatest } from 'rxjs';
import { switchMap, map, take, tap, filter, shareReplay } from 'rxjs/operators';

import { App, Trigger, CONTRIB_REFS } from '@flogo-web/core';
import {
  LanguageService,
  FlowSummary,
  ERROR_CODE,
  LocalStorageService,
  SanitizeService,
  ShimTriggerBuildApiService,
  RESTAPIContributionsService,
  ContribSchema,
} from '@flogo-web/client-core';
import { ModalService } from '@flogo-web/client-core/modal';
import {
  ConfirmationResult,
  ConfirmationModalService,
} from '@flogo-web/client-core/confirmation';
import { NotificationsService } from '@flogo-web/client-core/notifications';
import {
  AppDetailService,
  ApplicationDetail,
  ApplicationDetailState,
  SETTING_DONT_WARN_MISSING_TRIGGERS,
  FlowGroup,
  AppResourcesStateService,
} from '../core';
import {
  NewResourceComponent,
  NewResourceData,
} from '../new-resource/new-resource.component';
import {
  ExportFlowsData,
  FlogoExportFlowsComponent,
} from '../export-flows/export-flows.component';

import {
  ShimTriggerData,
  TriggerShimBuildComponent,
} from '../shim-trigger/shim-trigger.component';
import {
  MissingTriggerConfirmationComponent,
  ConfirmationResult as MissingTriggerConfirmationResult,
  ConfirmationParams,
} from '../missing-trigger-confirmation';
import { ResourceViewType, DeleteEvent } from '../resource-views';
import { BUILD_OPTIONS } from './build-options';

const MAX_SECONDS_TO_ASK_APP_NAME = 5;

@Component({
  selector: 'flogo-apps-details-application',
  templateUrl: 'app-detail.component.html',
  styleUrls: ['app-detail.component.less'],
})
export class FlogoApplicationDetailComponent implements OnChanges, OnInit {
  @Input() appDetail: ApplicationDetail;

  @Output() flowSelected: EventEmitter<FlowSummary> = new EventEmitter<FlowSummary>();

  application: App;
  state: ApplicationDetailState;

  isNameInEditMode: boolean;
  autofocusName = true;
  editableName: string;

  isDescriptionInEditMode: boolean;
  editableDescription: string;

  resourceViewType: ResourceViewType = 'resources';

  flows: Array<FlowSummary> = [];
  isNewApp = false;
  isBuildBoxShown = false;
  isBuilding: boolean;
  isDetailsMenuOpen = false;

  buildOptions = BUILD_OPTIONS;

  shimmableTriggerSchema$: Observable<ContribSchema[]>;
  shimTriggerOptions = [];
  isExportBoxShown = false;
  downloadLink: string;

  constructor(
    public resourcesState: AppResourcesStateService,
    private translate: LanguageService,
    private appDetailService: AppDetailService,
    private confirmationModalService: ConfirmationModalService,
    private sanitizer: SanitizeService,
    private contributionService: RESTAPIContributionsService,
    private shimTriggersApiService: ShimTriggerBuildApiService,
    private notificationsService: NotificationsService,
    private modalService: ModalService,
    private localStorage: LocalStorageService
  ) {
    this.shimmableTriggerSchema$ = this.contributionService
      .getShimContributionDetails()
      .pipe(shareReplay(1));
  }

  ngOnInit() {
    this.isDescriptionInEditMode = false;
    this.isNameInEditMode = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    const change = changes['appDetail'];
    if (change.currentValue) {
      this.application = this.appDetail.app;
      this.state = this.appDetail.state;
      this.downloadLink = this.appDetailService.getDownloadLink(this.application.id);
      this.shimTriggerOptions = [];
      this.loadShimTriggerBuildOptions();
      const prevValue = change.previousValue;
      const isDifferentApp =
        !prevValue || !prevValue.app || prevValue.app.id !== this.application.id;
      if (isDifferentApp) {
        this.appUpdated();
      } else {
        this.appDetailChanged();
      }
    }
  }

  appExporter() {
    return () => {
      this.closeExportBox();
      return this.confirmActionWhenMissingTriggers('export')
        .toPromise()
        .then(proceed => {
          if (!proceed) {
            return null;
          }
          return this.performExportApp();
        });
    };
  }

  private performExportApp() {
    return this.appDetailService
      .toEngineSpec()
      .then(engineApp => {
        const appName = snakeCase(engineApp.name);
        return [
          {
            fileName: `${appName}.json`,
            data: engineApp,
          },
        ];
      })
      .catch(errRsp => {
        if (
          errRsp &&
          errRsp.errors &&
          errRsp.errors[0] &&
          errRsp.errors[0].code === ERROR_CODE.HAS_SUBFLOW
        ) {
          this.notificationsService.error({
            key: 'DETAILS-EXPORT:CANNOT-EXPORT',
          });
        } else {
          console.error(errRsp.errors);
          this.notificationsService.error({
            key: 'DETAILS-EXPORT:ERROR_UNKNOWN',
          });
        }
      });
  }

  buildApp({ os, arch }) {
    this.closeBuildBox();
    this.confirmActionWhenMissingTriggers('build')
      .pipe(filter(Boolean))
      .subscribe(() =>
        this.handleBuildDownload(
          this.appDetailService.build(this.application.id, { os, arch })
        )
      );
  }

  buildShimTrigger(selectedTriggerDetails) {
    this.handleBuildDownload(
      this.shimTriggersApiService.buildShimTrigger(selectedTriggerDetails)
    );
  }

  openCreateFlowFromTrigger(trigger: Trigger) {
    this.openCreateResource(trigger.id);
  }

  openCreateResource(triggerId?: string) {
    const newFlowData: NewResourceData = { appId: this.application.id };
    if (triggerId) {
      newFlowData.triggerId = triggerId;
    }
    return this.modalService
      .openModal<NewResourceData>(NewResourceComponent, newFlowData)
      .result.pipe(filter(Boolean))
      .subscribe(({ name, description, type }) => {
        this.appDetailService.createResource({ name, description, type }, triggerId);
      });
  }

  onClickAddDescription() {
    this.isDescriptionInEditMode = true;
  }

  openExportFlow() {
    const flows = this.application.resources;
    return this.modalService.openModal<ExportFlowsData>(FlogoExportFlowsComponent, {
      flows,
    });
  }

  onNameSave() {
    let editableName = this.editableName || '';
    editableName = editableName.trim();
    if (!editableName) {
      return;
    }
    editableName = this.sanitizer.sanitizeHTMLInput(editableName);
    this.isNameInEditMode = false;
    this.appDetailService.update('name', editableName);
  }

  onNameCancel() {
    this.isNameInEditMode = false;
    this.appDetailService.cancelUpdate('name');
    this.editableName = this.application.name;
  }

  onDescriptionSave() {
    this.isDescriptionInEditMode = false;
    this.editableDescription = this.sanitizer.sanitizeHTMLInput(this.editableDescription);
    this.appDetailService.update('description', this.editableDescription);
  }

  onDescriptionCancel() {
    this.isDescriptionInEditMode = false;
    this.appDetailService.cancelUpdate('description');
    this.editableDescription = this.application.description;
  }

  onClickLabelDescription() {
    this.isDescriptionInEditMode = true;
  }

  onClickLabelName() {
    this.isNameInEditMode = true;
  }

  onFlowSelected(flow) {
    this.flowSelected.emit(flow);
  }

  onFlowDelete({ resource, triggerId }: DeleteEvent) {
    this.appDetailService.removeResource(resource.id, triggerId);
  }

  onDeleteApp(application) {
    this.closeDetailsMenu();
    this.translate
      .get(['APP-DETAIL:CONFIRM_DELETE', 'MODAL:CONFIRM-DELETION'], {
        appName: application.name,
      })
      .pipe(
        switchMap(translation => {
          return this.confirmationModalService.openModal({
            title: translation['MODAL:CONFIRM-DELETION'],
            textMessage: translation['APP-DETAIL:CONFIRM_DELETE'],
          }).result;
        })
      )
      .subscribe(result => {
        if (result === ConfirmationResult.Confirm) {
          this.appDetailService.deleteApp();
        }
      });
  }

  toggleBuildBox() {
    this.isBuildBoxShown = !this.isBuildBoxShown;
  }

  closeBuildBox() {
    this.isBuildBoxShown = false;
  }

  showShimTriggerList(ref) {
    const isLambdaTrigger = ref === CONTRIB_REFS.LAMBDA;
    this.resourcesState.groupsByTrigger$
      .pipe(
        take(1),
        map((flowGroups: FlowGroup[]) =>
          flowGroups.filter(
            flowGroup => flowGroup.trigger && flowGroup.trigger.ref === ref
          )
        ),
        switchMap(shimTriggersList => {
          if (isLambdaTrigger && shimTriggersList.length === 1) {
            return observableOf({ triggerId: shimTriggersList[0].trigger.id });
          } else {
            return this.modalService.openModal<ShimTriggerData>(
              TriggerShimBuildComponent,
              {
                shimTriggersList,
                buildOptions: this.buildOptions,
              }
            ).result;
          }
        })
      )
      .subscribe(buildParams => {
        if (buildParams) {
          this.buildShimTrigger(buildParams);
        }
      });
    this.closeBuildBox();
  }

  toggleExportBox() {
    this.isExportBoxShown = !this.isExportBoxShown;
  }

  closeExportBox() {
    this.isExportBoxShown = false;
  }

  resourceViewChanged(viewType: ResourceViewType) {
    this.resourceViewType = viewType;
  }

  toggleDetailsMenu() {
    this.isDetailsMenuOpen = !this.isDetailsMenuOpen;
  }

  closeDetailsMenu() {
    this.isDetailsMenuOpen = false;
  }

  private confirmActionWhenMissingTriggers(
    exportType: 'export' | 'build'
  ): Observable<boolean> {
    const appHasTriggers = app =>
      app &&
      app.flowGroups &&
      app.flowGroups.length > 0 &&
      app.flowGroups.some(g => !!g.trigger);
    if (
      this.localStorage.getItem(SETTING_DONT_WARN_MISSING_TRIGGERS) ||
      appHasTriggers(this.appDetail.app)
    ) {
      return observableOf(true);
    }
    return this.modalService
      .openModal<ConfirmationParams>(MissingTriggerConfirmationComponent, {
        type: exportType,
      })
      .result.pipe(
        take(1),
        tap((result: MissingTriggerConfirmationResult) => {
          if (result && result.dontShowAgain) {
            this.localStorage.setItem(SETTING_DONT_WARN_MISSING_TRIGGERS, 'true');
          }
        }),
        map(result => result && result.confirm)
      );
  }

  private handleBuildDownload(download: Observable<any>) {
    const restoreBuildFlag = () => (this.isBuilding = false);
    const handleBuildError = () => {
      this.notificationsService.error({ key: 'DETAILS:BUILD-ERROR' });
      restoreBuildFlag();
    };

    this.isBuilding = true;
    download.subscribe(restoreBuildFlag, handleBuildError);
  }

  private appUpdated() {
    this.isDescriptionInEditMode = false;

    this.editableName = this.application.name;
    this.editableDescription = this.application.description;

    this.isNameInEditMode = false;
    this.isNewApp = !this.application.updatedAt;
    if (this.isNewApp) {
      const secondsSinceCreation = differenceInSeconds(
        Date.now(),
        this.application.createdAt
      );
      this.isNewApp = secondsSinceCreation <= MAX_SECONDS_TO_ASK_APP_NAME;
      this.isNameInEditMode = this.isNewApp;
    }
  }

  private appDetailChanged() {
    if (this.state.name.hasErrors) {
      this.isNameInEditMode = true;
      this.autofocusName = false;
      setTimeout(() => (this.autofocusName = true), 100);
    } else if (!this.state.name.pendingSave) {
      this.editableName = this.application.name;
    }
  }

  private getUniqueTriggerRefs(): Observable<Set<string>> {
    return this.resourcesState.groupsByTrigger$.pipe(
      map(flowGroups => {
        return new Set(
          flowGroups.reduce((triggerRefs, group) => {
            return group.trigger ? [...triggerRefs, group.trigger.ref] : triggerRefs;
          }, [])
        );
      })
    );
  }

  private loadShimTriggerBuildOptions() {
    combineLatest(this.getUniqueTriggerRefs(), this.shimmableTriggerSchema$)
      .pipe(
        take(1),
        map(([triggerRefs, shimmableTriggersDetails]) => {
          return shimmableTriggersDetails
            .filter(shimmableTriggerDetail => triggerRefs.has(shimmableTriggerDetail.ref))
            .map(shimmableTriggerDetail =>
              getShimmableTriggerBuildOption(shimmableTriggerDetail)
            );
        })
      )
      .subscribe(shimTriggerOptions => {
        this.shimTriggerOptions = shimTriggerOptions;
      });
  }
}

function getShimmableTriggerBuildOption(shimmableTriggerDetail: ContribSchema) {
  switch (shimmableTriggerDetail.ref) {
    case CONTRIB_REFS.LAMBDA:
      return {
        labelKey: 'TRIGGER-SHIM:SERVERLESS-APP',
        ref: shimmableTriggerDetail.ref,
      };
    case CONTRIB_REFS.CLI:
      return {
        labelKey: 'TRIGGER-SHIM:CLI-APP',
        ref: shimmableTriggerDetail.ref,
      };
    default:
      return {
        labelKey: shimmableTriggerDetail.name,
        ref: shimmableTriggerDetail.ref,
      };
  }
}
