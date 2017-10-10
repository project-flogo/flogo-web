import defaults from 'lodash/defaults';
import Ajv from 'ajv';
import { FLOGO_PROFILE_TYPES } from '../../common/constants';

function validate(schema, data, options = {}, customValidations) {
  const ajv = new Ajv(options);

  if (customValidations) {
    customValidations.forEach(validator => ajv.addKeyword(
      validator.keyword,
      { validate: validator.validate, errors: true }),
    );
  }

  const valid = ajv.validate(schema, data);
  return valid ? null : ajv.errors;
}

class Validator {

  static validateSimpleApp(data, isDeviceType) {
    let validationSchema;
    if (isDeviceType) {
      validationSchema = deviceAppSchema();
    } else {
      validationSchema = appSchema();
    }
    return validate(validationSchema, data, { removeAdditional: true, useDefaults: true, allErrors: true });
  }

  static validateTriggerCreate(data) {
    return validate(triggerSchemaCreate(), data, { removeAdditional: true, useDefaults: true, allErrors: true });
  }

  static validateTriggerDeviceCreate(data) {
    return validate(triggerDeviceSchemaCreate(), data, { removeAdditional: true, useDefaults: true, allErrors: true });
  }

  static validateActivityDeviceCreate(data) {
    return validate(activityDeviceSchemaCreate(), data, { removeAdditional: true, useDefaults: true, allErrors: true });
  }


  static validateTriggerUpdate(data) {
    return validate(triggerSchemaUpdate(), data, { removeAdditional: true, useDefaults: true, allErrors: true });
  }

  static validateHandler(data) {
    return validate(handlerEditableSchema(), data, { removeAdditional: true, useDefaults: true, allErrors: true });
  }

  static validateFullApp(profileType, data, contribVerify, options) {
    options = defaults({}, options, { removeAdditional: false, useDefaults: false, allErrors: true, verbose: true });
    let customValidations;
    if (contribVerify) {
      const makeInstalledValidator = (keyword, collection, type) => function validator(schema, vData) {
        const isInstalled = collection.includes(vData);
        if (!isInstalled) {
          validator.errors = [{ keyword, message: `${type} "${vData}" is not installed`, data }];
        }
        return isInstalled;
      };

      customValidations = [
        { keyword: 'trigger-installed', validate: makeInstalledValidator('trigger-installed', contribVerify.triggers || [], 'Trigger') },
        { keyword: 'activity-installed', validate: makeInstalledValidator('activity-installed', contribVerify.activities || [], 'Activity') },
      ];
    }

    let schemaToUse;
    if (profileType === FLOGO_PROFILE_TYPES.MICRO_SERVICE) {
      schemaToUse = fullAppSchema();
    } else {
      schemaToUse = fullDeviceAppSchema();
    }

    const errors = validate(schemaToUse, data, options, customValidations);
    if (errors && errors.length > 0) {
      // get rid of some info we don't want to expose
      errors.forEach(e => {
        delete e.params;
        delete e.schema;
        delete e.parentSchema;
      });
    }
    return errors;
  }

}


export { Validator };

function activityDeviceSchemaCreate() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    required: [
      'ref',
      'name',
      'type',
    ],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
      description: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      type: {
        type: 'string',
      },
      version: {
        type: 'string',
      },
      ref: {
        type: 'string',
      },
      settings: {
        type: 'array',
        default: [],
      },
      device_support: {
        type: 'array',
        default: [],
      },
    },
  };
}

function triggerDeviceSchemaCreate() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    required: [
      'ref',
      'name',
      'type',
    ],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
      description: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      type: {
        type: 'string',
      },
      version: {
        type: 'string',
      },
      ref: {
        type: 'string',
      },
      settings: {
        type: 'array',
        default: [],
      },
      outputs: {
        type: 'array',
        default: [],
      },
      device_support: {
        type: 'array',
        default: [],
      },
    },
  };
}

function triggerSchemaCreate() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    required: [
      'ref',
      'name',
    ],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
      description: {
        type: 'string',
      },
      ref: {
        type: 'string',
      },
      settings: {
        type: 'object',
        default: {},
      },
    },
  };
}

function triggerSchemaUpdate() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
      description: {
        type: 'string',
      },
      settings: {
        type: 'object',
      },
    },
  };
}

function deviceAppSchema() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    required: [
      'name',
      'type',
      'device',
    ],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
      description: {
        type: 'string',
      },
      type: {
        type: 'string',
        default: 'flogo:device',
      },
      device: {
        type: 'object',
        required: [
          'profile',
        ],
        properties: {
          profile: {
            type: 'string',
          },
          deviceType: {
            type: 'string',
            default: 'Feather M0 WIFI',
          },
          settings: {
            type: 'object',
          },
        },
      },
      version: {
        type: 'string',
        default: '0.1.0',
      },
    },
  };
}

function appSchema() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    required: [
      'name',
      'type',
    ],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        'x-notEmpty': true,
      },
      description: {
        type: 'string',
      },
      type: {
        type: 'string',
        default: 'flogo:uiapp',
      },
      version: {
        type: 'string',
        default: '0.1.0',
      },
    },
  };
}

function handlerEditableSchema() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    additionalProperties: false,
    properties: {
      settings: {
        type: 'object',
      },
      outputs: {
        type: 'object',
      },
      actionInputMappings: {
        $ref: '#/definitions/ActionInputMappingsCollection'
      },
      actionOutputMappings: {
        $ref: '#/definitions/ActionOutputMappingsCollection'
      }
    },
    definitions: {
      ActionInputMappingsCollection: {
        type: 'array',
        items: {
          $ref: '#/definitions/InputOutputMapping'
        }
      },
      ActionOutputMappingsCollection: {
        type: 'array',
        items: {
          $ref: '#/definitions/InputOutputMapping'
        }
      },
      InputOutputMapping: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'integer'
          },
          value: {
            type: 'string'
          },
          mapTo: {
            type: 'string'
          }
        }
      }
    }
  };
}

function fullAppSchema() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    required: [
      'name',
      'type',
      'version',
      'triggers',
      'actions',
    ],
    properties: {
      name: {
        type: 'string',
      },
      type: {
        type: 'string',
        default: 'flogo:app',
      },
      version: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      triggers: {
        additionalProperties: false,
        default: [],
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: {
              type: 'string',
            },
            ref: {
              type: 'string',
              'trigger-installed': true,
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            settings: {
              type: 'object',
              default: null,
            },
            handlers: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  actionId: {
                    type: 'string',
                  },
                  settings: {
                    type: 'object',
                    default: {
                    },
                  },
                  actionInputMappings: {
                    $ref: '#/definitions/ActionInputMappingsCollection'
                  },
                  actionOutputMappings: {
                    $ref: '#/definitions/ActionOutputMappingsCollection'
                  }
                },
                required: [
                  'actionId',
                  'settings',
                  'actionInputMappings',
                  'actionOutputMappings'
                ],
              },
            },
          },
          required: [
            'id',
            'ref',
            'settings',
            'handlers',
          ],
        },
      },
      actions: {
        default: [],
        type: 'array',
        items: {
          $ref: '#/definitions/ActionFlow',
        },
      },
    },
    definitions: {
      ActionInputMappingsCollection: {
        type: 'array',
        default: [],
        items: {
          $ref: '#/definitions/InputOutputMapping'
        }
      },
      ActionOutputMappingsCollection: {
        type: 'array',
        default: [],
        items: {
          $ref: '#/definitions/InputOutputMapping'
        }
      },
      InputOutputMapping: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'integer'
          },
          value: {
            type: 'string'
          },
          mapTo: {
            type: 'string'
          }
        }
      },
      ActionMetadata: {
        type: 'object',
        additionalProperties: false,
        properties: {
          input: {
            $ref: '#/definitions/ActionMetadata/definitions/AttributeCollection',
          },
          output: {
            $ref: '#/definitions/ActionMetadata/definitions/AttributeCollection',
          },
        },
        definitions: {
          AttributeCollection: {
            type: 'array',
            items: {
              $ref: '#/definitions/ActionMetadata/definitions/Attribute',
            },
          },
          Attribute: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              type: {
                type: 'string',
              },
            },
            required: ['name', 'type'],
          },
        },
      },
      ActionFlow: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
          },
          ref: {
            type: 'string',
          },
          metadata: {
            $ref: '#/definitions/ActionMetadata',
          },
          data: {
            type: 'object',
            properties: {
              flow: {
                $ref: '#/definitions/Flow',
              },
            },
          },
        },
        required: [
          'id',
          'ref',
          'data',
        ],
      },
      Flow: {
        title: 'flow',
        type: 'object',
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          ref: {
            type: 'string',
          },
          type: {
            type: 'integer',
          },
          attributes: {
            type: 'array',
            items: {
              $ref: '#/definitions/Flow/definitions/attribute',
            },
          },
          inputMappings: {
            type: 'array',
            items: {
              $ref: '#/definitions/Flow/definitions/mapping',
            },
          },
          rootTask: {
            title: 'rootTask',
            $ref: '#/definitions/Flow/definitions/rootTask',
          },
          errorHandlerTask: {
            title: 'errorHandlerTask',
            $ref: '#/definitions/Flow/definitions/rootTask',
          },
        },
        required: [
          'rootTask',
        ],
        definitions: {
          attribute: {
            title: 'attribute',
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              type: {
                enum: [
                  'string',
                  'integer',
                  'number',
                  'boolean',
                  'object',
                  'array',
                  'params',
                  'any',
                  'complex_object',
                ],
              },
              value: {
                type: [
                  'string',
                  'integer',
                  'number',
                  'boolean',
                  'object',
                  'array',
                  'null',
                ],
              },
            },
            required: [
              'name',
              'type',
              'value',
            ],
          },
          mapping: {
            title: 'mapping',
            type: 'object',
            properties: {
              type: {
                type: 'integer',
              },
              value: {
                type: 'string',
              },
              mapTo: {
                type: 'string',
              },
            },
            required: [
              'type',
              'value',
              'mapTo',
            ],
          },
          link: {
            title: 'link',
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              id: {
                type: 'integer',
              },
              from: {
                type: ['integer', 'string'],
              },
              to: {
                type: ['integer', 'string'],
              },
              type: {
                type: 'integer',
              },
              value: {
                type: 'string',
              },
            },
            required: [
              'id',
              'from',
              'to',
            ],
          },
          task: {
            title: 'task',
            type: 'object',
            properties: {
              id: {
                type: ['integer', 'string'],
              },
              type: {
                type: 'integer',
              },
              name: {
                type: 'string',
              },
              title: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              activityRef: {
                type: 'string',
                'activity-installed': true,
              },
              attributes: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/attribute',
                },
              },
              inputMappings: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/mapping',
                },
              },
              outputMappings: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/mapping',
                },
              },
              tasks: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/task',
                },
              },
              links: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/link',
                },
              },
            },
            required: [
              'id',
              'name',
              'activityRef',
            ],
          },
          rootTask: {
            title: 'rootTask',
            type: 'object',
            additionalProperties: false,
            properties: {
              id: {
                type: ['integer', 'string'],
              },
              type: {
                type: 'integer',
              },
              attributes: {
                type: 'array',
                default: [],
                items: {
                  $ref: '#/definitions/Flow/definitions/attribute',
                },
              },
              inputMappings: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/mapping',
                },
              },
              outputMappings: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/mapping',
                },
              },
              tasks: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/task',
                },
              },
              links: {
                type: 'array',
                items: {
                  $ref: '#/definitions/Flow/definitions/link',
                },
              },
            },
            required: [
              'id',
            ],
          },
        },
      },
      FlowEmbedded: {
        type: 'object',
        properties: {
          flow: {
            $ref: '#/definitions/Flow',
          },
        },
        required: [
          'flow',
        ],
      },
    },
  };
}

function fullDeviceAppSchema() {
  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    additionalProperties: false,
    type: 'object',
    required: [
      'name',
      'type',
      'version',
      'triggers',
      'actions',
      'device',
    ],
    properties: {
      name: {
        type: 'string',
      },
      type: {
        type: 'string',
        default: 'flogo:device',
      },
      version: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      device: {
        type: 'object',
        required: [
          'profile',
        ],
        properties: {
          profile: {
            type: 'string',
          },
        },
      },
      triggers: {
        additionalProperties: false,
        default: [],
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: {
              type: 'string',
            },
            ref: {
              type: 'string',
              'trigger-installed': true,
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            settings: {
              type: 'object',
              default: null,
            },
            actionId: {
              type: 'string',
            },
          },
          required: [
            'id',
            'ref',
            'actionId',
            'settings',
          ],
        },
      },
      actions: {
        default: [],
        type: 'array',
        items: {
          $ref: '#/definitions/ActionFlow',
        },
      },
    },
    definitions: {
      ActionFlow: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
          },
          ref: {
            type: 'string',
          },
          data: {
            type: 'object',
            properties: {
              flow: {
                $ref: '#/definitions/Flow',
              },
            },
          },
        },
        required: [
          'id',
          'ref',
          'data',
        ],
      },
      Flow: {
        title: 'flow',
        type: 'object',
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
          },
          tasks: {
            type: 'array',
            default: [],
            items: {
              $ref: '#/definitions/Flow/definitions/task',
            },
          },
          links: {
            type: 'array',
            items: {
              $ref: '#/definitions/Flow/definitions/link',
            },
          },
        },
        required: [
          'tasks',
          'links',
        ],
        definitions: {
          attribute: {
            title: 'attribute',
            type: 'object',
          },
          link: {
            title: 'link',
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              id: {
                type: 'integer',
              },
              from: {
                type: 'integer',
              },
              to: {
                type: 'integer',
              },
              type: {
                type: 'integer',
              },
              value: {
                type: 'string',
              },
            },
            required: [
              'id',
              'from',
              'to',
            ],
          },
          task: {
            title: 'task',
            type: 'object',
            properties: {
              id: {
                type: 'integer',
              },
              name: {
                type: 'string',
              },
              title: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              activityRef: {
                type: 'string',
                'activity-installed': true,
              },
              attributes: {
                $ref: '#/definitions/Flow/definitions/attribute',
              },
            },
            required: [
              'id',
              'name',
              'activityRef',
            ],
          },
        },
      },
    },
  };
}
