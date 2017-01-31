import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';

/**
 * Consolidates flows into the format expected by the flogo-cli
 * This means:
 * - Combine triggers based on its settings
 * - Point trigger endpoints to flows
 * @param {Array.<{flow:object, trigger:object}>} flowsData
 */
export function consolidateFlowsAndTriggers(flowsData = []) {
  const triggers = [];
  const flows = [];

  const findExistingTriggerEntry = trigger => triggers.find(entry =>
    // same trigger if same ref and same settings
     entry.ref === trigger.ref && isEqual(trigger.data.settings, entry.data.settings));

  flowsData
    .forEach((flowData) => {
      const { trigger, flow } = flowData;

      if (!flowData.trigger) {
        return; // empty trigger, we'll ignore it
      }

      const triggerEntry = determineTriggerEntry(trigger);
      const triggerEndpoints = trigger.data.endpoints || [];
      const endpointsEntry = triggerEndpoints[0] || { settings: {} };
      triggerEntry.data.endpoints.push(endpointsEntry);

      // link trigger to flow/action
      if (flowData.flow) {
        flows.push(flow);
        endpointsEntry.actionId = flow.id;
      }
    });

  return {
    triggers,
    flows,
  };

  function determineTriggerEntry(trigger) {
    // find if we have already processed another instance of the same trigger
    let triggerEntry = findExistingTriggerEntry(trigger);
    if (!triggerEntry) {
      // no previous entry for this trigger, we need to create one
      triggerEntry = cloneDeep(trigger);
      triggerEntry.data.endpoints = [];
      triggers.push(triggerEntry);
    }
    return triggerEntry;
  }
}
export default consolidateFlowsAndTriggers;
