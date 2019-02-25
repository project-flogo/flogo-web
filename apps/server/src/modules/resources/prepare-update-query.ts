const mapKeys = require('lodash/mapKeys');

interface UpdateQuery {
  $set?: any;
  $unset?: any;
}

export function prepareUpdateQuery(newAction, oldResource, indexOfResource) {
  const updateQuery: UpdateQuery = {};
  const modifierPrefix = `resources.${indexOfResource}`;
  // makes { $set: { 'resources.1.name': 'my action' } };
  updateQuery.$set = mapKeys(
    newAction,
    (v, fieldName) => `${modifierPrefix}.${fieldName}`
  );
  return updateQuery;
}
