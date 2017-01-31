import { flogoFlowToJSON, flogoTriggerToJSON } from '../../common/flow.model';

export function convertToCliSchema(flow) {
  return {
    trigger: flogoTriggerToJSON(flow),
    flow: flogoFlowToJSON(flow),
  };
}
export default convertToCliSchema;
