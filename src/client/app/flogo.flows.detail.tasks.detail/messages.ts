/**
 * Events published from this module
 */

export const PUB_EVENTS = {
  selectTask : {
    channel : 'flogo-flows-detail-tasks',
    topic : 'select-task'
  }
};

/**
 * Events subscribed by this module
 */
export const SUB_EVENTS = {
  selectTask : {
    channel : 'flogo-flows-detail-tasks',
    topic : 'public-select-task'
  },
  updateTriggerTask : {
    channel : 'flogo-flows-detail-tasks',
    topic : 'update-trigger'
  }
};
