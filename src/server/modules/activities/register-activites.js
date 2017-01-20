import Pouchdb from 'pouchdb';
import path from 'path';
import npm from 'npm';
import _ from 'lodash';
import fs from 'fs';
import {DBService} from '../../common/db.service';
import {config} from '../../config/app-config';
import {BaseRegistered} from '../base-registered';
import { TYPE_ACTIVITY, SCHEMA_FILE_NAME_ACTIVITY, DEFAULT_PATH_ACTIVITY } from '../../common/constants';

const defaultOptions = {
  type: TYPE_ACTIVITY,
  path: DEFAULT_PATH_ACTIVITY,
  schemaJsonName: SCHEMA_FILE_NAME_ACTIVITY
};

export class RegisterActivities extends BaseRegistered{
  constructor(dbName, options){
    super(dbName, _.merge({}, defaultOptions, options||{}));
  }

}
