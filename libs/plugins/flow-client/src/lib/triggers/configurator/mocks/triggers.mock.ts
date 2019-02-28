import { TriggerSchema, ValueType } from '@flogo-web/client-core';

export const TriggersMock = [
  {
    id: 'trigger_1',
    isValid: true,
    isDirty: false,
    name: 'Receive HTTP Message',
  },
  {
    id: 'trigger_2',
    isValid: true,
    isDirty: false,
    name: 'Receive HTTP Message (1) (1)',
  },
];

export const ConfigureTriggersMock = [
  {
    trigger: {
      name: 'Receive HTTP Message',
      ref: 'some_path_to_repo/trigger/rest',
      description: 'Simple REST Trigger',
      settings: {
        port: '8081',
      },
      id: 'trigger_1',
      createdAt: 'datetime',
      updatedAt: 'datetime',
      handlers: [
        {
          actionMappings: {
            input: [
              {
                mapTo: 'in',
                type: 2,
                value: 200,
              },
              {
                mapTo: 'in2',
                type: 2,
                value: 56565656,
              },
            ],
            output: [],
          },
          settings: {
            method: null,
            path: null,
          },
          outputs: {
            params: null,
            pathParams: null,
            queryParams: null,
            header: null,
            content: null,
          },
          resourceId: 'action_1',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        {
          actionMappings: {
            input: [
              {
                mapTo: 'in',
                type: 2,
                value: 200,
              },
              {
                mapTo: 'in2',
                type: 2,
                value: 56565656,
              },
            ],
            output: [],
          },
          settings: {
            method: null,
            path: null,
          },
          outputs: {
            params: null,
            pathParams: null,
            queryParams: null,
            header: null,
            content: null,
          },
          resourceId: 'action_2',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
      ],
      appId: 'app_1',
      handler: {
        actionMappings: {
          input: [
            {
              mapTo: 'in',
              type: 2,
              value: 200,
            },
            {
              mapTo: 'in2',
              type: 2,
              value: 56565656,
            },
          ],
          output: [],
        },
        settings: {
          method: null,
          path: null,
        },
        outputs: {
          params: null,
          pathParams: null,
          queryParams: null,
          header: null,
          content: null,
        },
        resourceId: 'action_1',
        createdAt: 'datetime',
        updatedAt: 'datetime',
      },
    },
    handler: {
      actionMappings: {
        input: [
          {
            mapTo: 'in',
            type: 2,
            value: 200,
          },
          {
            mapTo: 'in2',
            type: 2,
            value: 56565656,
          },
        ],
        output: [],
      },
      settings: {
        method: null,
        path: null,
      },
      outputs: {
        params: null,
        pathParams: null,
        queryParams: null,
        header: null,
        content: null,
      },
      resourceId: 'action_1',
      createdAt: 'datetime',
      updatedAt: 'datetime',
    },
  },
  {
    trigger: {
      name: 'Receive HTTP Message (1) (1)',
      ref: 'some_path_to_repo/trigger/rest',
      description: 'Simple REST Trigger',
      settings: {
        port: '8080',
      },
      id: 'trigger_2',
      createdAt: 'datetime',
      updatedAt: 'datetime',
      handlers: [
        {
          actionMappings: {
            input: [
              {
                mapTo: 'in',
                type: 2,
                value: 20,
              },
            ],
            output: [],
          },
          settings: {
            method: 'GET',
            path: '/testing',
          },
          outputs: {
            params: null,
            pathParams: null,
            queryParams: null,
            header: null,
            content: null,
          },
          resourceId: 'action_1',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
      ],
      appId: 'app_1',
      handler: {
        actionMappings: {
          input: [
            {
              mapTo: 'in',
              type: 2,
              value: 20,
            },
          ],
          output: [],
        },
        settings: {
          method: 'GET',
          path: '/testing',
        },
        outputs: {
          params: null,
          pathParams: null,
          queryParams: null,
          header: null,
          content: null,
        },
        resourceId: 'action_1',
        createdAt: 'datetime',
        updatedAt: 'datetime',
      },
    },
    handler: {
      actionMappings: {
        input: [
          {
            mapTo: 'in',
            type: 2,
            value: 20,
          },
        ],
        output: [],
      },
      settings: {
        method: 'GET',
        path: '/testing',
      },
      outputs: {
        params: null,
        pathParams: null,
        queryParams: null,
        header: null,
        content: null,
      },
      resourceId: 'action_1',
      createdAt: 'datetime',
      updatedAt: 'datetime',
    },
  },
];

export const ConfigureTriggerSchema: TriggerSchema = {
  type: 'flogo:trigger',
  name: 'flogo-rest',
  version: '0.0.1',
  title: 'Receive HTTP Message',
  description: 'Simple REST Trigger',
  homepage: 'some_path_to_repo/tree/master/trigger/rest',
  ref: 'some_path_to_repo/trigger/rest',
  settings: [
    {
      name: 'port',
      type: ValueType.Integer,
      required: true,
    },
  ],
  outputs: [
    {
      name: 'params',
      type: ValueType.Params,
    },
    {
      name: 'pathParams',
      type: ValueType.Params,
    },
    {
      name: 'queryParams',
      type: ValueType.Params,
    },
    {
      name: 'header',
      type: ValueType.Params,
    },
    {
      name: 'content',
      type: ValueType.Any,
    },
  ],
  handler: {
    settings: [
      {
        name: 'method',
        type: ValueType.String,
        required: true,
        allowed: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
      {
        name: 'path',
        type: ValueType.String,
        required: true,
      },
    ],
  },
  reply: [
    {
      name: 'code',
      type: ValueType.Integer,
    },
    {
      name: 'data',
      type: ValueType.Any,
    },
  ],
};

/*export const InvalidConfigureTriggersMock = [
  {
    'trigger': {
      'name': 'Receive HTTP Message',
      'ref': 'some_path_to_repo/trigger/rest',
      'description': 'Simple REST Trigger',
      'settings': {
        'port': '8081'
      },
      'id': 'trigger_1',
      'createdAt': 'datetime',
      'updatedAt': 'datetime',
      'handlers': [
        {
          'actionMappings': {
            'input': [
              {
                'mapTo': 'in',
                'type': 1,
                'value': '200dsfdsa'
              }
            ],
            'output': []
          },
          'settings': {
            'method': null,
            'path': null
          },
          'outputs': {
            'params': null,
            'pathParams': null,
            'queryParams': null,
            'header': null,
            'content': null
          },
          'resourceId': 'action_1',
          'createdAt': 'datetime',
          'updatedAt': 'datetime'
        }
      ],
      'appId': 'app_1',
      'handler': {
        'actionMappings': {
          'input': [
            {
              'mapTo': 'in',
              'type': 1,
              'value': '200dsfdsa'
            }
          ],
          'output': []
        },
        'settings': {
          'method': null,
          'path': null
        },
        'outputs': {
          'params': null,
          'pathParams': null,
          'queryParams': null,
          'header': null,
          'content': null
        },
        'resourceId': 'action_1',
        'createdAt': 'datetime',
        'updatedAt': 'datetime'
      }
    },
    'handler': {
      'actionMappings': {
        'input': [
          {
            'mapTo': 'in',
            'type': 1,
            'value': '200dsfdsa'
          }
        ],
        'output': []
      },
      'settings': {
        'method': null,
        'path': null
      },
      'outputs': {
        'params': null,
        'pathParams': null,
        'queryParams': null,
        'header': null,
        'content': null
      },
      'resourceId': 'action_1',
      'createdAt': 'datetime',
      'updatedAt': 'datetime'
    },
    'triggerSchema': {
      'name': 'Receive HTTP Message',
      'version': '0.0.1',
      'homepage': 'some_path_to_repo/tree/master/trigger/rest',
      'description': 'Simple REST Trigger',
      'installed': true,
      'settings': [
        {
          'name': 'port',
          'type': 'integer',
          'required': true,
          'value': '8081'
        }
      ],
      'outputs': [
        {
          'name': 'params',
          'type': 'params'
        },
        {
          'name': 'pathParams',
          'type': 'params'
        },
        {
          'name': 'queryParams',
          'type': 'params'
        },
        {
          'name': 'header',
          'type': 'params'
        },
        {
          'name': 'content',
          'type': 'any'
        }
      ],
      'ref': 'some_path_to_repo/trigger/rest',
      'handler': {
        'settings': [
          {
            'name': 'method',
            'type': 'string',
            'required': true,
            'allowed': [
              'GET',
              'POST',
              'PUT',
              'PATCH',
              'DELETE'
            ]
          },
          {
            'name': 'path',
            'type': 'string',
            'required': true
          }
        ]
      },
      '__props': {
        'errors': []
      },
      '__status': {},
      'id': 'trigger_1',
      'nodeId': 'trigger_node_1',
      'type': 0,
      'triggerType': 'flogo-rest',
      'reply': [
        {
          'name': 'code',
          'type': 'integer'
        },
        {
          'name': 'data',
          'type': 'any'
        }
      ]
    }
  }
];

export const FlowMetaDataMock = {
  'input': [
    {
      'name': 'in',
      'type': ValueType.String
    },
    {
      'name': 'in2',
      'type': ValueType.String
    }
  ],
  'output': []
};*/
