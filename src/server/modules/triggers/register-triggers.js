import Pouchdb from 'pouchdb';
import path from 'path';
import npm from 'npm';
import _ from 'lodash';
import fs from 'fs';
import {DBService} from '../../common/db.service';
import {config} from '../../config/app-config';
import {BaseRegistered} from '../base-registered';
import { TYPE_TRIGGER, SCHEMA_FILE_NAME_TRIGGER, DEFAULT_PATH_TRIGGER } from '../../common/constants';

const defaultOptions = {
  type: TYPE_TRIGGER,
  path: DEFAULT_PATH_TRIGGER,
  schemaJsonName: SCHEMA_FILE_NAME_TRIGGER
};

export class RegisterTriggers extends BaseRegistered{
  constructor(dbName, options){
    super(dbName, _.merge({}, defaultOptions, options||{}));
  }
}

