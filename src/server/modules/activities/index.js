import pick from 'lodash/pick';
import get from 'lodash/get';
import { PUBLISH_FIELDS_SHORT, PUBLISH_FIELDS_LONG } from './constants';
import { activitiesDBService } from '../../config/app-config';
import { VIEWS } from '../../common/db/activities';

export class ActivitiesManager {

  /**
   * List or find activities
   *
   * ## searchTerms
   * - name {string}  find by name with exactly this name (case insensitive)
   * - whereURL {string} find by url where property with exactly this where property (case insensitive)
   * If both search terms are provided search is executed by name
   *
   * ## options
   * - fields {string} Possible values:
   *    - short {string} - get short version of  activities
   *    - full {string} -  get full version of  activities
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

    return activitiesDBService.db
     .query(`views/${viewName}`, queryOpts)
     .then(result => (result.rows || [])
      .map(activityRow => cleanForOutput(activityRow.doc, fields))
    )
  }
}


function getStringForSearch(search) {
  return search ? search.trim().toLowerCase() : undefined;
}

function cleanForOutput(activity, fields) {
  let cleanActivity = Object.assign(
    { id: activity.id || activity._id },
    {where: activity.where, homepage:get(activity, 'schema.homepage', '')},
    activity.schema
  );

  if(fields == 'raw') {
    return activity;
  }

  if (fields === 'short') {
    cleanActivity = pick(cleanActivity, PUBLISH_FIELDS_SHORT);
  } else if (fields === 'full') {
    cleanActivity = pick(cleanActivity, PUBLISH_FIELDS_LONG);
  }
  return cleanActivity;
}
