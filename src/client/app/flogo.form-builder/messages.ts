/**
 * Events published from this module
 */

export const PUB_EVENTS = {
  runFromThisTile : {
    channel : 'flogo-task',
    topic : 'run-from-this-tile'
  },
  runFromTrigger : {
    channel: 'flogo-task',
    topic: 'run-from-this-trigger'
  },
  taskDetailsChanged: {
    chanel: 'flogo-task',
    topic: 'task-details-changed'
  },
  triggerDetailsChanged: {
    chanel: 'flogo-task',
    topic: 'trigger-details-changed'
  },
  changeTileDetail: {
    channel : 'flogo-task',
    topic : 'change-tile-detail'
  },
  setTaskWarnings: {
    channel: 'flogo-task',
    topic: 'set-task-warnings'
  }
};

/**
 * Events subscribed by this module
 */
export const SUB_EVENTS = {
  updatePropertiesToFormBuilder: {
    channel: 'flogo-task',
    topic: 'update-properties-form-builder'
  }
};
