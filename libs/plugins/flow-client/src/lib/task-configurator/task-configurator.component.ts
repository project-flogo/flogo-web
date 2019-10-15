import { cloneDeep } from 'lodash';
import { skip, takeUntil } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { trigger, transition, style, animate } from '@angular/animations';

import { Resource, ActivitySchema } from '@flogo-web/core';
import { SingleEmissionSubject, Dictionary } from '@flogo-web/lib-client/core';
import {
  isMapperActivity,
  isAcceptableIterateValue,
  isIterableTask,
  hasTaskWithSameName,
} from '@flogo-web/plugins/flow-core';
import { NotificationsService } from '@flogo-web/lib-client/notifications';

import {
  MapperTranslator,
  MapperControllerFactory,
  MapperController,
} from '../shared/mapper';
import { Tabs } from '../shared/tabs/models/tabs.model';
import {
  FlogoFlowService as FlowsService,
  InstalledFunctionSchema,
  Item,
  ItemActivityTask,
  ItemSubflow,
  ItemTask,
  Task,
  FLOGO_TASK_TYPE,
  FlowResource,
} from '../core';
import { FlowState, FlowActions, FlowSelectors } from '../core/state';
import {
  createIteratorMappingContext,
  getIteratorOutputSchema,
  ITERABLE_VALUE_KEY,
  ITERATOR_OUTPUT_KEY,
} from './models';
import { SubflowConfig } from './subflow-config';
import { AppState } from '../core/state/app.state';
import { mergeItemWithSchema } from '../core/models';
import { isSubflowTask } from '../core/models/flow/is-subflow-task';
import {
  getFlowMetadata,
  getInputContext,
} from '../core/models/task-configure/get-input-context';
import { getStateWhenConfigureChanges } from '../shared/configurator/configurator.selector';
import { createSaveAction } from './models/save-action-creator';

const TASK_TABS = {
  SUBFLOW: 'subFlow',
  ITERATOR: 'iterator',
  INPUT_MAPPINGS: 'inputMappings',
  SETTINGS: 'settings',
};
const ITERATOR_TAB_INFO = {
  name: TASK_TABS.ITERATOR,
  labelKey: 'TASK-CONFIGURATOR:TABS:ITERATOR',
};
const SUBFLOW_TAB_INFO = {
  name: TASK_TABS.SUBFLOW,
  labelKey: 'TASK-CONFIGURATOR:TABS:SUB-FLOW',
};
const MAPPINGS_TAB_INFO = {
  name: TASK_TABS.INPUT_MAPPINGS,
  labelKey: 'TASK-CONFIGURATOR:TABS:MAP-INPUTS',
};
const SETTINGS_TAB_INFO = {
  name: TASK_TABS.SETTINGS,
  labelKey: 'TASK-CONFIGURATOR:TABS:SETTINGS',
};
@Component({
  selector: 'flogo-flow-task-configurator',
  styleUrls: ['task-configurator.component.less'],
  templateUrl: 'task-configurator.component.html',
  animations: [
    trigger('dialog', [
      transition('void => *', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('250ms ease-in'),
      ]),
      transition('* => void', [
        animate('250ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class TaskConfiguratorComponent implements OnInit, OnDestroy {
  inputsSearchPlaceholderKey = 'TASK-CONFIGURATOR:ACTIVITY-INPUTS';
  inputScope: any[];

  tabs: Tabs;
  title: string;

  canIterate: boolean;
  initialIteratorData: {
    iteratorModeOn: boolean;
    iterableValue: string;
  };
  appId: string;
  actionId: string;
  currentTile: Task;
  activitySchemaUrl: string;
  iteratorModeOn = false;
  iterableValue: string;
  isSubflowType: boolean;
  currentSubflowSchema: Resource;
  subFlowConfig: SubflowConfig;
  subflowList: FlowResource[];
  showSubflowList = false;
  isActive = false;
  flowState: FlowState;
  inputMapperController: MapperController;
  iteratorController: MapperController;
  settingsController: MapperController;
  isValidTaskName: boolean;
  isTaskDetailEdited: boolean;
  ismapperActivity: boolean;
  installedFunctions: InstalledFunctionSchema[];
  private inputMapperStateSubscription: Subscription;
  private activitySettingsStateSubscription: Subscription;
  private contextChange$ = SingleEmissionSubject.create();
  private destroy$ = SingleEmissionSubject.create();

  constructor(
    private store: Store<AppState>,
    private flowsService: FlowsService,
    private mapperControllerFactory: MapperControllerFactory,
    private notificationsService: NotificationsService
  ) {
    this.isSubflowType = false;
    this.resetState();
  }

  ngOnInit() {
    this.store
      .pipe(
        getStateWhenConfigureChanges([
          FLOGO_TASK_TYPE.TASK,
          FLOGO_TASK_TYPE.TASK_SUB_PROC,
          FLOGO_TASK_TYPE.TASK_ITERATOR,
        ]),
        takeUntil(this.destroy$)
      )
      .subscribe(state => {
        if (state) {
          this.initConfigurator(state);
        } else if (this.isActive) {
          this.close();
        }
      });
    this.store
      .pipe(
        select(FlowSelectors.getInstalledFunctions),
        takeUntil(this.destroy$)
      )
      .subscribe(functions => {
        this.installedFunctions = functions;
      });
  }

  ngOnDestroy() {
    this.destroy$.emitAndComplete();
    if (!this.contextChange$.isStopped) {
      this.contextChange$.emitAndComplete();
    }
  }

  selectSubFlow() {
    const isParentFlow = (flowId: string) => flowId === this.actionId;
    const isCurrentlySelectedSubflow = (flowId: string) =>
      flowId === this.currentTile.settings.flowPath;
    this.flowsService.listFlowsForApp(this.appId).subscribe(flows => {
      this.subflowList = flows.filter(
        flow => !isParentFlow(flow.id) && !isCurrentlySelectedSubflow(flow.id)
      ) as FlowResource[];
      this.showSubflowList = true;
    });
  }

  subFlowChanged(event) {
    const subFlowTab = this.tabs.get(TASK_TABS.SUBFLOW);
    this.showSubflowList = false;
    subFlowTab.isDirty = true;
    this.createSubflowConfig(event);
    this.currentSubflowSchema = event;
    this.createChangedsubFlowConfig(event);
  }

  createChangedsubFlowConfig(event) {
    this.currentTile.name = event.name;
    this.currentTile.settings.flowPath = event.flowPath;
    this.currentTile.description = event.description;
    const mappings = [];
    const propsToMap = event.metadata ? event.metadata.input : [];
    this.resetInputMappingsController(propsToMap, this.inputScope, mappings);
  }

  onChangeIteratorMode() {
    this.iteratorModeOn = !this.iteratorModeOn;
    this.checkIsIteratorDirty();
    this.adjustIteratorInInputMapper();
  }

  save() {
    const isIterable =
      this.iteratorModeOn && isAcceptableIterateValue(this.iterableValue);
    createSaveAction(this.store, {
      tileId: this.currentTile.id,
      name: this.title,
      description: this.currentTile.description,
      subflowPath: this.currentTile.settings ? this.currentTile.settings.flowPath : null,
      changedSubflowSchema: this.currentSubflowSchema,
      iterator: {
        isIterable,
        iterableValue: isIterable ? this.iterableValue : undefined,
      },
      inputMappings: MapperTranslator.translateMappingsOut(
        this.inputMapperController.getCurrentState().mappings
      ),
      activitySettings: this.settingsController
        ? MapperTranslator.translateMappingsOut(
            this.settingsController.getCurrentState().mappings
          )
        : undefined,
    }).subscribe(action => {
      this.store.dispatch(action);
    });
  }

  selectTab(name: string) {
    const selectedTab = this.tabs.get(name);
    if (selectedTab.enabled) {
      this.tabs.markSelected(name);
      this.showSubflowList = false;
    }
  }

  subflowSelectionCancel() {
    this.showSubflowList = false;
  }

  cancel() {
    this.store.dispatch(new FlowActions.CancelItemConfiguration());
  }

  trackTabsByFn(index, [tabName, tab]) {
    return tabName;
  }

  changeTaskDetail(content, property) {
    this.isTaskDetailEdited = true;
    if (property === 'name') {
      const repeatedName = hasTaskWithSameName(
        content,
        this.flowState.mainItems,
        this.flowState.errorItems
      );
      if ((repeatedName && content !== this.currentTile.name) || content === '') {
        this.isValidTaskName = false;
      } else {
        this.isValidTaskName = true;
        this.title = content;
      }
    }
  }

  private onIteratorValueChange(newValue: any) {
    this.tabs.get(TASK_TABS.ITERATOR).isValid = MapperTranslator.isValidExpression(
      newValue
    );
    this.iterableValue = newValue;
    this.checkIsIteratorDirty();
  }

  private checkIsIteratorDirty() {
    const iteratorTab = this.tabs.get(TASK_TABS.ITERATOR);
    if (!this.initialIteratorData) {
      iteratorTab.isDirty = false;
      return;
    }

    let isDirty = false;
    if (this.initialIteratorData.iteratorModeOn && !this.iteratorModeOn) {
      isDirty = true;
    } else {
      isDirty =
        this.iteratorModeOn &&
        this.iterableValue !== this.initialIteratorData.iterableValue;
    }
    iteratorTab.isDirty = isDirty;
  }

  private configureOutputMapperLabels() {
    this.inputsSearchPlaceholderKey = 'TASK-CONFIGURATOR:FLOW-OUTPUTS';
    this.tabs.get(TASK_TABS.INPUT_MAPPINGS).labelKey =
      'TASK-CONFIGURATOR:TABS:MAP-OUTPUTS';
  }

  private initConfigurator(state: FlowState) {
    this.flowState = state;
    const itemId = state.taskConfigure;
    this.ensurePreviousContextCleanup();
    this.contextChange$ = SingleEmissionSubject.create();

    const selectedItem = <ItemTask>(
      cloneDeep(state.mainItems[itemId] || state.errorItems[itemId])
    );
    const activitySchema: ActivitySchema = (state.schemas[selectedItem.ref] ||
      {}) as ActivitySchema;
    this.activitySchemaUrl = activitySchema.homepage;
    this.currentTile = mergeItemWithSchema(selectedItem, activitySchema);

    this.inputScope = getInputContext(itemId, state);
    this.isSubflowType = isSubflowTask(this.currentTile.type);
    this.title = this.currentTile.name;
    this.isValidTaskName = true;
    this.ismapperActivity = false;
    this.isTaskDetailEdited = false;
    const isSubflowItem = (item: Item): item is ItemSubflow => isSubflowTask(item.type);
    this.isSubflowType = isSubflowItem(selectedItem);
    let subflowSchema = null;
    if (isSubflowItem(selectedItem)) {
      subflowSchema = state.linkedSubflows[selectedItem.settings.flowPath];
      if (subflowSchema) {
        this.appId = state.appId;
        this.actionId = state.id;
        this.createSubflowConfig(subflowSchema);
      } else {
        return this.notificationsService.error({
          key: 'SUBFLOW:REFERENCE-ERROR-TEXT',
        });
      }
    }

    const flowMetadata = getFlowMetadata(state);
    const { propsToMap, mappings } = this.getInputMappingsInfo({
      activitySchema,
      subflowSchema,
      flowMetadata,
    });
    this.resetInputMappingsController(propsToMap, this.inputScope, mappings);
    this.initIterator(selectedItem);

    if (isMapperActivity(activitySchema)) {
      this.configureOutputMapperLabels();
      this.ismapperActivity = true;
    }

    this.resetState();

    if (this.tabs.get(TASK_TABS.SETTINGS)) {
      const { settingPropsToMap, activitySettings } = this.getActivitySettingsInfo(
        activitySchema
      );
      if (settingPropsToMap) {
        this.initActivitySettings(settingPropsToMap, activitySettings);
        this.tabs.get(TASK_TABS.SETTINGS).enabled = true;
        this.selectTab(TASK_TABS.SETTINGS);
      } else {
        if (this.settingsController) {
          this.settingsController = null;
        }
        this.tabs.get(TASK_TABS.SETTINGS).enabled = false;
      }
    }

    if (this.ismapperActivity) {
      this.configureOutputMapperLabels();
    }

    if (this.iteratorController) {
      this.iteratorController.state$
        .pipe(takeUntil(this.contextChange$))
        .subscribe(mapperState => {
          const iterableMapping = MapperTranslator.translateMappingsOut(
            mapperState.mappings
          );
          if (iterableMapping.hasOwnProperty(ITERABLE_VALUE_KEY)) {
            this.onIteratorValueChange(iterableMapping[ITERABLE_VALUE_KEY]);
          }
        });
    }
    this.open();
  }

  private adjustIteratorInInputMapper() {
    if (this.iteratorModeOn) {
      this.enableIteratorInInputMapper();
    } else {
      this.disableIteratorInInputMapper();
    }
  }

  private enableIteratorInInputMapper() {
    const iteratorNode = this.mapperControllerFactory.createNodeFromSchema(
      getIteratorOutputSchema()
    );
    this.inputMapperController.appendOutputNode(iteratorNode);
  }

  private disableIteratorInInputMapper() {
    this.inputMapperController.removeOutputNode(ITERATOR_OUTPUT_KEY);
  }

  private initIterator(selectedItem: ItemTask) {
    const taskSettings = selectedItem.settings;
    this.canIterate = !(<ItemActivityTask>selectedItem).return;
    if (!this.canIterate) {
      this.iteratorController = null;
      return;
    }
    this.iteratorModeOn = isIterableTask(selectedItem);
    this.iterableValue = taskSettings && taskSettings.iterate ? taskSettings.iterate : '';
    this.initialIteratorData = {
      iteratorModeOn: this.iteratorModeOn,
      iterableValue: this.iterableValue,
    };
    const iteratorContext = createIteratorMappingContext(this.iterableValue);
    this.iteratorController = this.mapperControllerFactory.createController(
      iteratorContext.inputContext,
      this.inputScope,
      iteratorContext.mappings,
      this.installedFunctions
    );
    this.adjustIteratorInInputMapper();
  }

  private initActivitySettings(settingPropsToMap, activitySettings) {
    const { subscription, controller } = this.configureMappingsController(
      TASK_TABS.SETTINGS,
      this.activitySettingsStateSubscription,
      { propsToMap: settingPropsToMap, inputScope: [], mappings: activitySettings }
    );
    this.activitySettingsStateSubscription = subscription;
    this.settingsController = controller;
  }

  private configureMappingsController(
    tabType: string,
    prevSubscription: Subscription,
    { propsToMap, inputScope, mappings }
  ) {
    if (prevSubscription && !prevSubscription.closed) {
      prevSubscription.unsubscribe();
    }
    const controller = this.mapperControllerFactory.createController(
      propsToMap,
      inputScope,
      mappings,
      this.installedFunctions
    );
    const subscription = controller.status$
      .pipe(
        skip(1),
        takeUntil(this.contextChange$)
      )
      .subscribe(({ isValid, isDirty }) => {
        const selectedTab = this.tabs.get(tabType);
        selectedTab.isValid = isValid;
        selectedTab.isDirty = isDirty;
      });
    return { controller, subscription };
  }

  private getInputMappingsInfo({
    flowMetadata,
    activitySchema,
    subflowSchema,
  }): { propsToMap: any[]; mappings: Dictionary<any> } {
    let propsToMap = [];
    const mappings = this.currentTile.inputMappings;
    const isOutputMapper = isMapperActivity(activitySchema);
    if (isOutputMapper) {
      propsToMap = flowMetadata.output;
    } else if (this.isSubflowType) {
      propsToMap = subflowSchema.metadata ? subflowSchema.metadata.input : [];
    } else if (this.currentTile.attributes && this.currentTile.attributes.inputs) {
      propsToMap = this.currentTile.attributes.inputs;
    }

    return { mappings, propsToMap };
  }

  private getActivitySettingsInfo(
    activitySchema
  ): { settingPropsToMap: any[]; activitySettings: { [settingName: string]: any } } {
    const activitySettings = this.currentTile.activitySettings;
    const settingPropsToMap = activitySchema.settings;
    return { activitySettings, settingPropsToMap };
  }

  private resetInputMappingsController(propsToMap, inputScope, mappings) {
    const { subscription, controller } = this.configureMappingsController(
      TASK_TABS.INPUT_MAPPINGS,
      this.inputMapperStateSubscription,
      { propsToMap, inputScope, mappings }
    );
    this.inputMapperStateSubscription = subscription;
    this.inputMapperController = controller;
  }

  private createSubflowConfig(subflowSchema: Resource) {
    this.subFlowConfig = {
      name: subflowSchema.name,
      description: subflowSchema.description,
      createdAt: subflowSchema.createdAt,
      flowPath: subflowSchema.id,
    };
  }

  private resetState() {
    if (this.tabs) {
      this.tabs.clear();
    }
    let tabsInfo = [MAPPINGS_TAB_INFO];
    let tabToSelect = TASK_TABS.INPUT_MAPPINGS;
    this.showSubflowList = false;
    if (this.isSubflowType) {
      tabsInfo = [SUBFLOW_TAB_INFO, ...tabsInfo];
      tabToSelect = TASK_TABS.SUBFLOW;
    } else if (!this.ismapperActivity) {
      tabsInfo = [SETTINGS_TAB_INFO, ...tabsInfo];
    }
    if (this.canIterate) {
      tabsInfo = [...tabsInfo, ITERATOR_TAB_INFO];
    }
    this.tabs = Tabs.create(tabsInfo);
    this.selectTab(tabToSelect);
  }

  private open() {
    this.isActive = true;
  }

  private close() {
    if (!this.contextChange$.closed) {
      this.contextChange$.emitAndComplete();
    }
    this.isActive = false;
  }

  private ensurePreviousContextCleanup() {
    if (this.contextChange$ && !this.contextChange$.isStopped) {
      this.contextChange$.emitAndComplete();
    }
  }
}
