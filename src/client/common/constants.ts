/**
 * Enumerations
 */

export enum FLOGO_PROFILE_TYPE {
  MICRO_SERVICE,
  DEVICE
}

export enum FLOGO_TASK_TYPE {
  TASK_ROOT,  // this is the type for triggers
  TASK,
  TASK_BRANCH,
  TASK_SUB_PROC,
  TASK_LOOP
}

export enum FLOGO_PROCESS_TYPE { DEFAULT = 1 }

export enum FLOGO_TASK_ATTRIBUTE_TYPE {
  STRING,
  INTEGER,
  NUMBER,
  BOOLEAN,
  OBJECT,
  ARRAY,
  PARAMS,
  ANY
}

/**
 * Constants
 */

export const FLOGO_PROCESS_MODELS = {
  'DEFAULT' : 'simple'
};

/* construct the default values fo types */

let defaultValues = <{[key : number] : any}>{};
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.STRING] = '';
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.INTEGER] = 0;
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.NUMBER] = 0.0;
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.BOOLEAN] = false;
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.OBJECT] = null;
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.ARRAY] = [];
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.PARAMS] = null;
defaultValues[FLOGO_TASK_ATTRIBUTE_TYPE.ANY] = null;

export const DEFAULT_VALUES_OF_TYPES = defaultValues;
/**
 * Defined in modules
 */

export const FLOGO_ERROR_ROOT_NAME = '__error-trigger';

export * from '../app/flogo.flows.detail.diagram/constants';
export {REGEX_INPUT_VALUE_EXTERNAL as FLOGO_AUTOMAPPING_FORMAT} from '../app/flogo.transform/constants';

export const ERROR_CODE = {
  REQUIRED: 'RequiredProperty',
  UNIQUE: 'UniqueValue',
  NOT_INSTALLED_TRIGGER: 'notInstalledTrigger',
  NOT_INSTALLED_ACTIVITY: 'notInstalledActivity',
  WRONG_INPUT_JSON_FILE: 'wrongInputJSONFile'
};

export const ERROR_CONSTRAINT = {
  NOT_UNIQUE: 'notUnique',
  NOT_INSTALLED_TRIGGER: 'notInstalledTrigger',
  NOT_INSTALLED_ACTIVITY: 'notInstalledActivity',
  WRONG_INPUT_JSON_FILE: 'wrongInputJSONFile'
};

export const DEFAULT_MQTT_SETTINGS = {
  "settings": {
    "mqtt:server": "192.168.50.164",
    "mqtt:port": "1883",
    "mqtt:user": "",
    "mqtt:pass": "",
    "wifi:ssid": "RT-N600_D8_2G",
    "wifi:password": "random_7943"
  }
};
