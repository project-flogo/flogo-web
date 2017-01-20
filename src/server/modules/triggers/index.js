import pick from 'lodash/pick';
import get from 'lodash/get';
import { PUBLISH_FIELDS_SHORT, PUBLISH_FIELDS_LONG } from './constants';
import { triggersDBService } from '../../config/app-config';
import { VIEWS } from '../../common/db/triggers';

export class TriggerManager {

  /**
   * List or find triggers
   *
   * ## searchTerms
   * - name {string}  find by name with exactly this name (case insensitive)
   * - whereURL {string} find by url where property with exactly this where property (case insensitive)
   * If both search terms are provided search is executed by name
   *
   * ## options
   * - fields {string} Possible values:
   *    - short {string} - get short version of  triggers
   *    - full {string} -  get full version of  triggers
   *    - raw {string} (deprecated) -  get raw version from db
   *
   * @param terms
   * @params terms.name {string} name of the app
   * @params terms.whereURL {string} url where property
   * @params options
   * @params options.fields {string} which fields to retrieve, defaults to 'full' version
   */
  static find(terms = {}, options ) {
    const queryOpts = { include_docs: true };
    const { fields} = Object.assign({ fields: 'full'}, options);
    let viewName = 'name';

    if (terms.whereURL) {
      queryOpts.key = getStringForSearch(terms.whereURL);
      viewName = 'where';
    }

    // default view
    if (terms.name) {
      queryOpts.key = getStringForSearch(terms.name);
      viewName = 'name';
    }

    return triggersDBService.db
     .query(`views/${viewName}`, queryOpts)
     .then(result => (result.rows || [])
      .map(triggerRow => cleanForOutput(triggerRow.doc, fields))
    )
  }
}


function getStringForSearch(search) {
  return search ? search.trim().toLowerCase() : undefined;
}

function cleanForOutput(trigger, fields) {
  let cleanTrigger = Object.assign(
    { id: trigger.id || trigger._id },
    {where: trigger.where, homepage: get(trigger,'schema.homepage','')},
    trigger.schema
  );

  if(fields == 'raw') {
    return trigger;
  }

  if (fields === 'short') {
    cleanTrigger = pick(cleanTrigger, PUBLISH_FIELDS_SHORT);
  } else if (fields === 'full') {
    cleanTrigger = pick(cleanTrigger, PUBLISH_FIELDS_LONG);
  }
  return cleanTrigger;
}
