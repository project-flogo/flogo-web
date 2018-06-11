import { createSelector } from '@ngrx/store';
// todo: move to shared location
import { TriggerStatus } from '../../../triggers/configurator/interfaces';
import { selectFlowMetadata, selectHandlers, selectTriggerConfigure, selectTriggers } from '../flow/flow.selectors';

export const getAllTabs = createSelector(selectTriggerConfigure, state => state.tabs);

const getConfigurableTriggerDetails = createSelector(
  selectHandlers,
  selectTriggers,
  (handlers, triggers) => {
    return Object.values(handlers).map(handler => ({
      trigger: triggers[handler.triggerId],
      handler,
    }));
  }
);

export const selectCurrentTriggerId = createSelector(
  selectTriggerConfigure,
  triggerConfigureState => triggerConfigureState.selectedTriggerId
);

const selectTriggerConfigureTriggers = createSelector(selectTriggerConfigure, triggerConfigureState => triggerConfigureState.triggers);
export const getTriggerStatuses = createSelector(selectTriggerConfigureTriggers, (triggers): TriggerStatus[] => Object
  .keys(triggers)
  .map((triggerId): TriggerStatus => {
    return {
      id: triggerId,
      name: triggers[triggerId].name,
      isValid: triggers[triggerId].isValid,
      isDirty: triggers[triggerId].isDirty,
    };
  }));

const getCurrentTrigger = createSelector(
  selectTriggerConfigureTriggers,
  selectCurrentTriggerId,
  (triggersState, currentTriggerId) => {
    return triggersState[currentTriggerId];
  }
);

export const getCurrentTabType = createSelector(selectTriggerConfigure, (triggerConfigure) => {
  return triggerConfigure ? triggerConfigure.currentTab : null;
});

export const getCurrentTabs = createSelector(
  getCurrentTrigger,
  getAllTabs,
  (currentTrigger, tabs) => currentTrigger.tabs.map(tabId => tabs[tabId]),
);

export const getHasTriggersConfigure = createSelector(selectTriggerConfigure, triggerConfigure => !!triggerConfigure);

export const getConfigureModalState = createSelector(
  selectTriggerConfigure,
  selectFlowMetadata,
  getConfigurableTriggerDetails,
  (triggerConfigure, flowMetadata, triggers) => {
    return {
      triggers,
      flowMetadata,
      triggerConfigure
    };
  }
);