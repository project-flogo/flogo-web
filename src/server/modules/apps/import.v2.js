import cloneDeep from 'lodash/cloneDeep';

import { ErrorManager, ERROR_TYPES } from '../../common/errors';
import { Validator } from './validator';

import { AppsManager } from './index.v2';
import { AppsTriggersManager } from './triggers';
import { HandlersManager } from './handlers';
import { ActionsManager } from '../actions';

import { ActivitiesManager as ContribActivitiesManager } from '../activities';
import { TriggerManager as ContribTriggersManager } from '../triggers';
import { ContribsManager as ContribDeviceManager } from '../contribs';
import {FLOGO_PROFILE_TYPES} from "../../common/constants";
import {getProfileType} from "../../common/utils/profile";
import {getDefaultValueByType} from "../../common/utils/index";

export function importApp(fromApp) {
  const clonedApp = cloneDeep(fromApp);
  const appProfile = getProfileType(fromApp);
  // TODO: apply unique names to tasks
  return getInstalledActivitiesAndTriggers(appProfile)
    .then(installedContribs => {
      const errors = Validator.validateFullApp(appProfile, clonedApp, installedContribs,
        { removeAdditional: true, useDefaults: true });
      if (errors && errors.length > 0) {
        throw ErrorManager.createValidationError('Validation error', { details: errors });
      }
    })
    .then(() => {
      if (appProfile === FLOGO_PROFILE_TYPES.DEVICE) {
        return Promise.all([
          ContribDeviceManager.find({type: 'flogo:device:trigger'}),
          ContribDeviceManager.find({type: 'flogo:device:activity'}),
        ])
          .then(([triggerContribs, activityContribs]) => {
            fromApp.triggers = fromApp.triggers.map(trigger => deviceTriggerFormatter(trigger, triggerContribs));
            fromApp.actions = fromApp.actions.map(action => deviceActionFormatter(action, activityContribs));
          });
      }
    })
    .then(() => AppsManager.create(clonedApp))
    .then(app => Promise.all(fromApp.actions.map(action =>
        ActionsManager.create(app.id, action).then(storedAction => [action.id, storedAction])))
        .then(actionPairs => ({ appId: app.id, actionsMap: new Map(actionPairs) })),
    )
    .then(({ appId, actionsMap }) => {
      const triggerGroups = makeTriggerGroups(fromApp.triggers, actionsMap);
      return chainPromises(triggerGroups, triggerGroup => registerTriggerGroup(appId, triggerGroup))
        .then(() => AppsManager.findOne(appId));
    });
}

function makeTriggerGroups(triggers, actionsMap) {
  return triggers
    .map(trigger => ({
      trigger,
      handlers: trigger.handlers
        .map(handler => ({ handler, action: actionsMap.get(handler.actionId) }))
        .filter(h => !!h.action),
    }));
}

function registerTriggerGroup(appId, { trigger, handlers }) {
  if (!trigger.name) {
    trigger.name = trigger.id;
  }
  return AppsTriggersManager.create(appId, trigger)
    .then(savedTrigger => chainPromises(handlers,
      handlerGroup => HandlersManager.save(savedTrigger.id, handlerGroup.action.id, handlerGroup.handler)),
    );
}

function chainPromises(from, thenDo) {
  return from.reduce((promiseChain, e) => promiseChain.then(() => thenDo(e)), Promise.resolve(true));
}

function getInstalledActivitiesAndTriggers(profileType) {
  const mapRefs = contribs => contribs.map(c => c.ref);
  let contribPromise;
  if (profileType === FLOGO_PROFILE_TYPES.MICRO_SERVICE) {
    contribPromise = Promise.all([
      ContribTriggersManager.find().then(mapRefs),
      ContribActivitiesManager.find().then(mapRefs),
    ]);
  } else {
    contribPromise = Promise.all([
      ContribDeviceManager.find({ type: 'flogo:device:trigger' }).then(mapRefs),
      ContribDeviceManager.find({ type: 'flogo:device:activity' }).then(mapRefs),
    ]);
  }
  return contribPromise.then(([triggers, activities]) => ({ triggers, activities }));
}

function deviceTriggerFormatter(trigger, installedTriggers){
  let triggerSettingsArray = cloneDeep(installedTriggers.find(triggerContrib => trigger.ref === triggerContrib.ref).settings);
  let fullTriggerSettings = {};
  triggerSettingsArray.forEach(triggerSetting => {
    fullTriggerSettings[triggerSetting.name] = getDefaultValueByType(triggerSetting.type);
    if(trigger.settings[triggerSetting.name]){
      fullTriggerSettings[triggerSetting.name] = trigger.settings[triggerSetting.name];
    }
  });
  trigger.settings = fullTriggerSettings;
  trigger.handlers = [];
  trigger.handlers.push({
    "settings": {},
    actionId: trigger.actionId
  });
  return trigger;
}

function deviceActionFormatter(action, installedActivities){
  if(!action.name) {
    action.name = action.id;
  }
  if(action.data.flow){
    action.data.flow.rootTask = {
      id: 1,
      type: 1,
      links: cloneDeep(action.data.flow.links),
      tasks: cloneDeep(action.data.flow.tasks)
    };
    action.data.flow.rootTask.tasks = action.data.flow.rootTask.tasks.map(function(task){
      let attributesArray = cloneDeep(installedActivities.find(activity => activity.ref === task.activityRef).settings);
      attributesArray = attributesArray.map(function(attribute){
        attribute.value = "";
        if(task.attributes[attribute.name]){
          attribute.value = task.attributes[attribute.name]
        }
        return attribute;
      });
      task.attributes = attributesArray;
      return task;
    });
    action.data.flow.attributes = [];
    delete(action.data.flow.tasks);
    delete(action.data.flow.links);
  }
  return action;
}

/*

It is not used for the time being as our activities contribution fetching api's do not have activityRef

export function extractRefs(app) {
  const allRefs = { triggers: [], activities: [] };
  const triggerRefMap = new Map();
  const triggers = isArray(app.triggers) ? app.triggers : [];

  triggers.forEach(t => {
    if (isObject(t) && t.ref && !triggerRefMap.get(t.ref)) {
      triggerRefMap.set(t.ref, true);
    }
  });
  allRefs.triggers = Array.from(triggerRefMap.keys());

  const activityRefMap = new Map();
  const actions = isArray(app.actions) ? app.actions : [];
  actions.forEach(a => {
    const tasks = get(a, 'data.flow.rootTask.tasks', [])
      .concat(a, 'data.flow.errorHandler.tasks', []);
    tasks.forEach(t => {
      if (isObject(t) && t.ref && !activityRefMap.get(t.activityRef)) {
        activityRefMap.set(a.activityRef, true);
      }
    });
  });
  allRefs.activities = Array.from(activityRefMap.keys());
  return allRefs;
}*/
