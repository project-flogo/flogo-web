import { snakeCase } from 'lodash';
import { differenceInSeconds } from 'date-fns';

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  OnInit,
  Inject,
} from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import {
  switchMap,
  map,
  take,
  tap,
  filter,
  distinctUntilKeyChanged,
  takeUntil,
} from 'rxjs/operators';

import { App, Trigger, CONTRIB_REFS, TriggerSchema } from '@flogo-web/core';
import {
  ResourceSummary,
  ERROR_CODE,
  LocalStorageService,
  SanitizeService,
  ShimTriggerBuildService,
  SingleEmissionSubject,
  ResourcePluginManifest,
  HttpUtilsService,
} from '@flogo-web/lib-client/core';
import { LanguageService } from '@flogo-web/lib-client/language';
import { ModalService } from '@flogo-web/lib-client/modal';
import {
  ConfirmationResult,
  ConfirmationModalService,
} from '@flogo-web/lib-client/confirmation';
import { NotificationsService } from '@flogo-web/lib-client/notifications';
import {
  AppDetailService,
  SETTING_DONT_WARN_MISSING_TRIGGERS,
  ShimBuildOptions,
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
import { RESOURCE_PLUGINS_CONFIG } from '../../core';

const MAX_SECONDS_TO_ASK_APP_NAME = 5;

interface FieldUiState {
  inEditMode: boolean;
  value?: string;
  errors?: { [key: string]: string };
}

@Component({
  selector: 'flogo-apps-details-application',
  templateUrl: 'app-detail.component.html',
  styleUrls: ['app-detail.component.less'],
})
export class FlogoApplicationDetailComponent implements OnDestroy, OnChanges, OnInit {
  @Input() appId: string;
  @Output() resourceSelected = new EventEmitter<ResourceSummary>();
  @Output() appDeleted = new EventEmitter<void>();

  application: App;
  triggerSchemas: TriggerSchema[];

  nameUiState: FieldUiState = {
    inEditMode: false,
  };
  autofocusName = false;

  descriptionUiState: FieldUiState = {
    inEditMode: false,
  };

  resourceViewType: ResourceViewType = 'resources';

  isDetailsMenuOpen = false;
  isExportBoxShown = false;

  buildOptions = BUILD_OPTIONS;
  isBuildBoxShown = false;
  isBuilding: boolean;

  shimTriggerOptions = [];

  private destroyed$ = SingleEmissionSubject.create();

  getTriggerIconUrl = ref => {
    const triggerSchema = this.triggerSchemas.find(schema => schema.ref === ref);
    if (triggerSchema?.icon) {
      return this.httpUtilsService.apiPrefix(triggerSchema.icon);
    }
    return null;
  };

  constructor(
    @Inject(RESOURCE_PLUGINS_CONFIG) private resourcePlugins: ResourcePluginManifest[],
    public appDetailService: AppDetailService,
    private translate: LanguageService,
    private confirmationModalService: ConfirmationModalService,
    private sanitizer: SanitizeService,
    private shimTriggersApiService: ShimTriggerBuildService,
    private notificationsService: NotificationsService,
    private modalService: ModalService,
    private localStorage: LocalStorageService,
    private httpUtilsService: HttpUtilsService
  ) {}

  ngOnChanges({ appId: appIdChange }: SimpleChanges) {
    if (appIdChange && this.appId) {
      this.appDetailService.load(this.appId);
    }
  }

  ngOnInit() {
    this.appDetailService
      .getTriggersSchemas()
      .then((schemas: TriggerSchema[]) => {
        this.triggerSchemas = schemas;
      });

    this.appDetailService.app$.subscribe(app => {
      this.application = app;
      this.descriptionUiState = {
        ...this.descriptionUiState,
        value: this.application.description,
      };
    });
    const takeUntilDestroyed = takeUntil(this.destroyed$);

    this.appDetailService
      .getAvailableShimBuildOptions()
      .pipe(takeUntilDestroyed)
      .subscribe((options: ShimBuildOptions[]) => {
        this.shimTriggerOptions = options;
      });

    this.appDetailService.app$
      .pipe(distinctUntilKeyChanged<App>('id'), takeUntilDestroyed)
      .subscribe(() => {
        this.focusNameFieldIfNewApp();
      });
    this.showActionEventNotifications();
  }

  ngOnDestroy() {
    this.destroyed$.emitAndComplete();
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
    this.descriptionUiState = {
      ...this.descriptionUiState,
      inEditMode: true,
      value: this.application.description,
    };
  }

  openExportFlow() {
    return this.modalService.openModal<ExportFlowsData>(FlogoExportFlowsComponent, {
      flows: this.appDetailService.getResources(),
    });
  }

  onNameSave() {
    let editableName = this.nameUiState.value || '';
    editableName = editableName.trim();
    if (!editableName) {
      return;
    }
    editableName = this.sanitizer.sanitizeHTMLInput(editableName);
    this.nameUiState.inEditMode = false;
    this.nameUiState.errors = null;
    this.appDetailService.updateProperty('name', editableName).subscribe(null, errors => {
      this.nameUiState = {
        inEditMode: true,
        value: editableName,
        errors,
      };
      this.autofocusName = false;
      setTimeout(() => (this.autofocusName = true), 100);
    });
  }

  onNameCancel() {
    this.nameUiState = {
      inEditMode: false,
    };
  }

  onDescriptionSave() {
    this.descriptionUiState = { ...this.descriptionUiState, inEditMode: false };
    let description = this.sanitizer.sanitizeHTMLInput(this.descriptionUiState.value);
    this.appDetailService.updateProperty('description', description);
  }

  onDescriptionCancel() {
    this.descriptionUiState = { inEditMode: false, value: this.application.description };
  }

  onClickLabelDescription() {
    this.descriptionUiState = { inEditMode: true, value: this.application.description };
  }

  onClickLabelName() {
    this.nameUiState = { inEditMode: true, value: this.application.name };
  }

  onResourceSelected(flow) {
    this.resourceSelected.emit(flow);
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
        }),
        switchMap(result => {
          return result === ConfirmationResult.Confirm
            ? this.appDetailService.deleteApp()
            : observableOf(false);
        })
      )
      .subscribe(isDeleted => {
        if (isDeleted) {
          this.appDeleted.emit();
        }
      });
  }

  toggleBuildBox() {
    this.isBuildBoxShown = !this.isBuildBoxShown;
  }

  closeBuildBox() {
    this.isBuildBoxShown = false;
  }

  openShimmableActionsFor(triggerRef: string) {
    const isLambdaTrigger = triggerRef === CONTRIB_REFS.LAMBDA;
    this.appDetailService
      .getShimTriggersListFor(triggerRef)
      .pipe(
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
    if (this.localStorage.getItem(SETTING_DONT_WARN_MISSING_TRIGGERS)) {
      return observableOf(true);
    }

    return this.appDetailService.hasTriggers().pipe(
      take(1),
      switchMap(hasTriggers =>
        !hasTriggers ? this.showTriggerConfirmation(exportType) : observableOf(true)
      )
    );
  }

  private showTriggerConfirmation(exportType) {
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

  private focusNameFieldIfNewApp() {
    if (this.application.updatedAt && this.nameUiState.inEditMode) {
      this.nameUiState = {
        inEditMode: false,
      };
      return;
    }
    const secondsSinceCreation = differenceInSeconds(
      Date.now(),
      new Date(this.application.createdAt)
    );
    const isNewApp = secondsSinceCreation <= MAX_SECONDS_TO_ASK_APP_NAME;
    this.nameUiState = { inEditMode: isNewApp, value: this.application.name };
  }

  private showActionEventNotifications() {
    this.appDetailService.actionEvent$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(actionEvent => {
        if (actionEvent.type === 'action-creation') {
          const action = this.resourcePlugins.find(resource => {
            return resource.type === actionEvent.action.type;
          });
          if (action) {
            this.notificationsService.success({
              key: 'APP-DETAIL:SUCCESS-MESSAGE-ACTION-CREATED',
              params: {
                actionType: action.label,
              },
            });
          }
        } else if (actionEvent.type === 'action-error') {
          this.notificationsService.error({
            key: 'APP-DETAIL:CREATE-ACTION-ERROR',
            params: actionEvent.error,
          });
        }
      });
  }
}
