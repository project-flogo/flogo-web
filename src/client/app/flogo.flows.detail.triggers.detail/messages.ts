/**
 * Events published from this module
 */

export const PUB_EVENTS = {
  selectTrigger : {
    channel : 'flogo-flows-detail-trigger',
    topic : 'select-trigger'
  },
  triggerAction : {
    channel : 'flogo-flows-detail-tasks',
    topic : 'trigger-action'
  }
};

/**
 * Events subscribed by this module
 */
export const SUB_EVENTS = {
  selectTrigger : {
    channel : 'flogo-flows-detail-trigger',
    topic : 'select-trigger'
  }
};
