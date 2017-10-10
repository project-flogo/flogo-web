import pick from 'lodash/pick';
import defaults from 'lodash/defaults';

import { apps as appsDb, dbUtils } from '../../common/db';
import { ErrorManager, ERROR_TYPES } from '../../common/errors';
import { Validator } from './validator';
import {getProfileType} from "../../common/utils/profile";
import {FLOGO_PROFILE_TYPES} from "../../common/constants";

const EDITABLE_FIELDS = [
  'settings',
  'outputs',
  'actionInputMappings',
  'actionOutputMappings',
];

export class HandlersManager {

  static save(triggerId, actionId, handlerData) {
    if (!triggerId || !actionId) {
      throw new TypeError('Params triggerId and actionId are required');
    }

    const findQuery = { 'triggers.id': triggerId, 'actions.id': actionId };
    return appsDb.findOne(findQuery, { actions: 1, triggers: 1, device: 1 })
      .then(app => {
        if (!app) {
          throw ErrorManager.makeError('App not found', { type: ERROR_TYPES.COMMON.NOT_FOUND });
        }

        const errors = Validator.validateHandler(handlerData);
        if (errors) {
          throw ErrorManager.createValidationError('Validation error', errors);
        }
        let handler = cleanInput(handlerData, EDITABLE_FIELDS);

        const triggerIndex = app.triggers.findIndex(t => t.id === triggerId);
        const trigger = app.triggers[triggerIndex];

        let updateQuery = {};
        const now = dbUtils.ISONow();

        const existingHandlerIndex = trigger.handlers.findIndex(h => h.actionId === actionId);
        if (existingHandlerIndex >= 0) {
          const existingHandler = trigger.handlers[existingHandlerIndex];
          handler = defaults(handler, existingHandler);
          handler.updatedAt = now;
          updateQuery = { $set: { [`triggers.${triggerIndex}.handlers.${existingHandlerIndex}`]: handler } };
        } else {
          handler = defaults(handler, {
            actionId,
            createdAt: now,
            updatedAt: null,
            settings: {},
            outputs: {},
          });
          /* Need to add actionInputMappings and actionOutputMappings only for Microservice profile*/
          if (getProfileType(app) === FLOGO_PROFILE_TYPES.MICRO_SERVICE) {
            handler.actionInputMappings = [];
            handler.actionOutputMappings = [];
          }
          updateQuery = { $push: { [`triggers.${triggerIndex}.handlers`]: handler } };
        }

        return appsDb.update(findQuery, updateQuery, {})
          .then(modifiedCount => HandlersManager.findOne(triggerId, actionId));
      });
  }

  static findOne(triggerId, actionId) {
    return appsDb.findOne({ 'triggers.id': triggerId }, { triggers: 1 })
      .then(app => {
        if (!app) {
          return null;
        }
        const trigger = app.triggers.find(t => t.id === triggerId);
        const handler = trigger.handlers.find(h => h.actionId === actionId);
        if (handler) {
          handler.appId = app._id;
          handler.triggerId = trigger.id;
        }
        return handler;
      });
  }

  static list(triggerId) {
    return appsDb.findOne({ 'triggers.id': triggerId })
      .then(app => (app.triggers.handlers ? app.triggers.handlers : []));
  }

  static remove(triggerId, actionId) {
    if (!triggerId || !actionId) {
      throw new TypeError('Params triggerId and actionId are required');
    }
    return appsDb.findOne({ 'triggers.id': triggerId, 'actions.id': actionId }, { triggers: 1, actions: 1})
      .then(app => {
        const triggerIndex = app.triggers.findIndex(t => t.id === triggerId);
        return appsDb.update(
          { 'triggers.id': triggerId, 'actions.id': actionId },
          { $pull: { [`triggers.${triggerIndex}.handlers`]: { actionId } } },
          {});
      })
      .then(numRemoved => numRemoved > 0);
  }

  static removeByActionId(actionId) {
    return appsDb.findOne({ 'triggers.handlers.actionId': actionId }, { triggers: 1 })
      .then(app => {
        if (!app) {
          return null;
        }

        const triggerIndex = app.triggers.findIndex(t => t.handlers.findIndex(h => h.actionId === actionId) >= 0);
        if (triggerIndex >= 0) {
          return appsDb.update(
            { 'triggers.handlers.actionId': actionId },
            { $pull: { [`triggers.${triggerIndex}.handlers`]: { actionId } } },
            {});
        }
        return null;
      })
      .then(numRemoved => numRemoved > 0);
  }

}

function cleanInput(trigger, fields) {
  const cleanTrigger = pick(trigger, fields);
  if (cleanTrigger.name) {
    cleanTrigger.name = cleanTrigger.name.trim();
  }
  return cleanTrigger;
}
