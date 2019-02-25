import { defaults, isEmpty, pick } from 'lodash';
import { injectable, inject } from 'inversify';
import { TOKENS } from '../../core';
import { Database } from '../../common/database.service';
import { ErrorManager, ERROR_TYPES } from '../../common/errors';
import { Validator } from './validator';
import { ISONow } from '../../common/utils';

const EDITABLE_FIELDS = ['settings', 'outputs', 'actionMappings'];

@injectable()
export class HandlersService {
  constructor(@inject(TOKENS.AppsDb) private appsDb: Database) {}

  save(triggerId, resourceId, handlerData) {
    if (!triggerId || !resourceId) {
      throw new TypeError('Params triggerId and resourceId are required');
    }

    const findQuery = { 'triggers.id': triggerId, 'resources.id': resourceId };
    return this.appsDb.findOne(findQuery, { resources: 1, triggers: 1 }).then(app => {
      if (!app) {
        throw ErrorManager.makeError('App not found', {
          type: ERROR_TYPES.COMMON.NOT_FOUND,
        });
      }

      const errors = Validator.validateHandler(handlerData);
      if (errors) {
        throw ErrorManager.createValidationError('Validation error', errors);
      }
      let handler = cleanInput(handlerData, EDITABLE_FIELDS);

      const triggerIndex = app.triggers.findIndex(t => t.id === triggerId);
      const trigger = app.triggers[triggerIndex];

      let updateQuery = {};
      const now = ISONow();

      const existingHandlerIndex = trigger.handlers.findIndex(
        h => h.resourceId === resourceId
      );
      if (existingHandlerIndex >= 0) {
        const existingHandler = trigger.handlers[existingHandlerIndex];
        handler = defaults(handler, existingHandler);
        handler.updatedAt = now;
        updateQuery = {
          $set: {
            [`triggers.${triggerIndex}.handlers.${existingHandlerIndex}`]: handler,
          },
        };
      } else {
        handler = defaults(handler, {
          resourceId,
          createdAt: now,
          updatedAt: null,
          settings: {},
          outputs: {},
          actionMappings: {
            input: {},
            output: {},
          },
        });
        updateQuery = {
          $push: { [`triggers.${triggerIndex}.handlers`]: handler },
        };
      }

      return this.appsDb
        .update(findQuery, updateQuery, {})
        .then(modifiedCount => this.findOne(triggerId, resourceId));
    });
  }

  findOne(triggerId, resourceId) {
    return this.appsDb
      .findOne({ 'triggers.id': triggerId }, { triggers: 1 })
      .then(app => {
        if (!app) {
          return null;
        }
        const trigger = app.triggers.find(t => t.id === triggerId);
        const handler = trigger.handlers.find(h => h.resourceId === resourceId);
        if (handler) {
          handler.appId = app._id;
          handler.triggerId = trigger.id;
        }
        return handler;
      });
  }

  list(triggerId) {
    return this.appsDb
      .findOne({ 'triggers.id': triggerId })
      .then(app => (app.triggers.handlers ? app.triggers.handlers : []));
  }

  remove(triggerId, resourceId) {
    if (!triggerId || !resourceId) {
      throw new TypeError('Params triggerId and resourceId are required');
    }
    return this.appsDb
      .findOne(
        { 'triggers.id': triggerId, 'resources.id': resourceId },
        { triggers: 1, resources: 1 }
      )
      .then(app => {
        const triggerIndex = app.triggers.findIndex(t => t.id === triggerId);
        return this.appsDb.update(
          { 'triggers.id': triggerId, 'resources.id': resourceId },
          { $pull: { [`triggers.${triggerIndex}.handlers`]: { resourceId } } },
          {}
        );
      })
      .then(numRemoved => numRemoved > 0);
  }

  removeByResourceId(resourceId) {
    return this.appsDb
      .findOne({ 'triggers.handlers.resourceId': resourceId }, { triggers: 1 })
      .then(app => {
        if (!app) {
          return null;
        }
        const pull = app.triggers.reduce((result, trigger, index) => {
          const existingHandlers = trigger.handlers.findIndex(
            handler => handler.resourceId === resourceId
          );
          if (existingHandlers >= 0) {
            result['triggers.' + index + '.handlers'] = { resourceId };
          }
          return result;
        }, {});
        if (!isEmpty(pull)) {
          return this.appsDb.update(
            { 'triggers.handlers.resourceId': resourceId },
            { $pull: pull },
            {}
          );
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
