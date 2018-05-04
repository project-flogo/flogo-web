export let mockFlow = {
  'id': 'test_flow_1',
  'name': 'Test flow 1',
  'description': 'Hello world!!',
  'app': {
    'id': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
    'name': 'Sample Application',
    'normalizedName': 'sample-application',
    'version': '',
    'description': '',
    'createdAt': '2017-03-21T09:43:38.614Z',
    'updatedAt': '2017-03-21T09:43:53.073Z'
  },
  'ref': 'github.com/TIBCOSoftware/flogo-contrib/action/flow',
  'data': {
    'flow': {
      'type': 1,
      'attributes': [],
      'rootTask': {
        'id': 'root',
        'type': 1,
        'activityRef': '',
        'name': 'root',
        'tasks': [
          {
            'id': 2,
            'name': 'First Log',
            'activityRef': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
            'type': 1,
            'attributes': [
              {
                'name': 'message',
                'value': 'I am here 1',
                'type': 'string'
              },
              {
                'name': 'flowInfo',
                'value': 'true',
                'type': 'boolean'
              },
              {
                'name': 'addToFlow',
                'value': 'true',
                'type': 'boolean'
              }
            ]
          },
          {
            'id': 3,
            'name': 'Counter1',
            'activityRef': 'github.com/TIBCOSoftware/flogo-contrib/activity/counter',
            'type': 1,
            'attributes': [
              {
                'name': 'counterName',
                'value': 'counter1',
                'type': 'string'
              },
              {
                'name': 'increment',
                'value': 'true',
                'type': 'boolean'
              },
              {
                'name': 'reset',
                'value': false,
                'type': 'boolean'
              }
            ]
          },
          {
            'id': 4,
            'name': 'Second Log',
            'activityRef': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
            'type': 1,
            'attributes': [
              {
                'name': 'message',
                'value': 'I am here 2',
                'type': 'string'
              },
              {
                'name': 'flowInfo',
                'value': 'true',
                'type': 'boolean'
              },
              {
                'name': 'addToFlow',
                'value': 'true',
                'type': 'boolean'
              }
            ]
          },
          {
            'id': 5,
            'name': 'Third Log',
            'activityRef': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
            'type': 1,
            'attributes': [
              {
                'name': 'message',
                'value': 'I am here 3',
                'type': 'string'
              },
              {
                'name': 'flowInfo',
                'value': 'true',
                'type': 'boolean'
              },
              {
                'name': 'addToFlow',
                'value': 'true',
                'type': 'boolean'
              }
            ]
          }
        ],
        'links': [
          {
            'id': 1,
            'from': 2,
            'to': 3,
            'type': 0
          },
          {
            'id': 2,
            'from': 3,
            'to': 4,
            'type': 1,
            'value': 'true'
          },
          {
            'id': 3,
            'from': 3,
            'to': 5,
            'type': 1,
            'value': 'false'
          }
        ]
      }
    }
  }
};

export let mockErrorFlow = {
  'id': 'test_flow_1',
  'name': 'Test flow 1',
  'description': 'Hello world!!',
  'app': {
    'id': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
    'name': 'Sample Application',
    'normalizedName': 'sample-application',
    'version': '',
    'description': '',
    'createdAt': '2017-03-21T09:43:38.614Z',
    'updatedAt': '2017-03-21T09:43:53.073Z'
  },
  'ref': 'github.com/TIBCOSoftware/flogo-contrib/action/flow',
  'data': {
    'flow': {
      'type': 1,
      'attributes': [],
      'rootTask': {
        'id': 'root',
        'type': 1,
        'activityRef': '',
        'name': 'root',
        'tasks': [
          {
            'id': 2,
            'name': 'First Log',
            'type': 1,
            'attributes': [
              {
                'name': 'message',
                'value': 'I am here 1',
                'type': 'string'
              },
              {
                'name': 'flowInfo',
                'value': 'true',
                'type': 'boolean'
              },
              {
                'name': 'addToFlow',
                'value': 'true',
                'type': 'boolean'
              }
            ]
          }
        ],
        'links': []
      }
    }
  }
};

export let mockTransformationData = {
  'attributes': [
    {
      'name': 'message',
      'value': null,
      'type': 'string'
    },
    {
      'name': 'flowInfo',
      'value': 'true',
      'type': 'boolean'
    },
    {
      'name': 'addToFlow',
      'value': 'true',
      'type': 'boolean'
    }
  ],
  'inputMappings': [
    {
      'type': 1,
      'value': '{T.content}',
      'mapTo': 'message'
    }
  ]
};

export let mockErrorHandler = {
  'errorHandlerTask': {
    'id': 6,
    'type': 1,
    'activityRef': '',
    'name': 'error_root',
    'tasks': [
      {
        'id': 7,
        'name': 'Error Log',
        'activityRef': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
        'type': 1,
        'attributes': [
          {
            'name': 'message',
            'value': 'Error Log 1',
            'type': 'string'
          },
          {
            'name': 'flowInfo',
            'value': 'true',
            'type': 'boolean'
          },
          {
            'name': 'addToFlow',
            'value': 'true',
            'type': 'boolean'
          }
        ]
      }
    ],
    'links': []
  }
};

export let mockActivitiesDetails = [
  {
    'id': 'tibco-log',
    'name': 'tibco-log',
    'version': '0.0.1',
    'description': 'Simple Log Activity',
    'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
    'homepage': 'https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log',
    'inputs': [
      {
        'name': 'message',
        'type': 'string',
        'value': ''
      },
      {
        'name': 'flowInfo',
        'type': 'boolean',
        'value': 'true'
      },
      {
        'name': 'addToFlow',
        'type': 'boolean',
        'value': 'true'
      }
    ],
    'outputs': [
      {
        'name': 'message',
        'type': 'string'
      }
    ]
  },
  {
    'id': 'tibco-counter',
    'name': 'tibco-counter',
    'version': '0.0.1',
    'description': 'Simple Global Counter Activity',
    'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/counter',
    'homepage': 'https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/counter',
    'inputs': [
      {
        'name': 'counterName',
        'type': 'string',
        'required': true
      },
      {
        'name': 'increment',
        'type': 'boolean'
      },
      {
        'name': 'reset',
        'type': 'boolean'
      }
    ],
    'outputs': [
      {
        'name': 'value',
        'type': 'integer'
      }
    ]
  }
];

export let mockResultantUIFlow = {
  'name': 'Test flow 1',
  'description': 'Hello world!!',
  'appId': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
  'app': {
    'id': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
    'name': 'Sample Application',
    'normalizedName': 'sample-application',
    'version': '',
    'description': '',
    'createdAt': '2017-03-21T09:43:38.614Z',
    'updatedAt': '2017-03-21T09:43:53.073Z'
  },
  'metadata': {
    'input': [],
    'output': []
  },
  'paths': {
    'root': { 'is': 'some_id_0' },
    'nodes': {
      'some_id_1': {
        'id': 'some_id_1',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': [],
        'type': 5,
        'taskID': 'some_id_1'
      },
      'some_id_2': {
        'id': 'some_id_2',
        '__status': { 'isSelected': false },
        'children': [
          'some_id_0',
          'some_id_1'
        ],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_2'
      },
      'some_id_3': {
        'id': 'some_id_3',
        '__status': { 'isSelected': false },
        'children': [],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_3'
      },
      'some_id_4': {
        'id': 'some_id_4',
        '__status': { 'isSelected': false },
        'children': [],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_4'
      },
      'some_id_5': {
        'id': 'some_id_5',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': ['some_id_0'],
        'type': 6,
        'taskID': 'some_id_5'
      },
      'some_id_6': {
        'id': 'some_id_6',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': ['some_id_0'],
        'type': 6,
        'taskID': 'some_id_6'
      }
    }
  },
  'items': {
    'some_id_7': {
      'name': 'First Log',
      'description': 'Simple Log Activity',
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        message: 'I am here 1',
        flowInfo: 'true',
        addToFlow: 'true',
      },
      'inputMappings': [],
      'id': 'some_id_7',
      'type': 1,
      return: false,
    },
    'some_id_8': {
      'name': 'Counter1',
      'description': 'Simple Global Counter Activity',
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/counter',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        counterName: 'counter1',
        increment: 'true',
        reset: false,
      },
      'inputMappings': [],
      'id': 'some_id_8',
      'type': 1,
      return: false,
    },
    'some_id_9': {
      'name': 'Second Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        message: 'I am here 2',
        flowInfo: 'true',
        addToFlow: 'true',
      },
      'inputMappings': [],
      'id': 'some_id_9',
      'type': 1,
    },
    'some_id_10': {
      'name': 'Third Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      'input': {
        message: 'I am here 3',
        flowInfo: 'true',
        addToFlow: 'true',
      },
      'inputMappings': [],
      'id': 'some_id_10',
      'type': 1,
    },
    'some_id_11': {
      'id': 'some_id_11',
      'type': 3,
      'description': undefined,
      'name': undefined,
      'condition': 'true'
    },
    'some_id_12': {
      'id': 'some_id_12',
      'type': 3,
      'description': undefined,
      'name': undefined,
      'condition': 'false'
    }
  }
};

export let mockResultantUIFlowWithError = {
  'name': 'Test flow 1',
  'description': 'Hello world!!',
  'appId': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
  'app': {
    'id': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
    'name': 'Sample Application',
    'normalizedName': 'sample-application',
    'version': '',
    'description': '',
    'createdAt': '2017-03-21T09:43:38.614Z',
    'updatedAt': '2017-03-21T09:43:53.073Z'
  },
  'metadata': {
    'input': [],
    'output': []
  },
  'paths': {
    'root': { 'is': 'some_id_0' },
    'nodes': {
      'some_id_1': {
        'id': 'some_id_1',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': [],
        'type': 5,
        'taskID': 'some_id_1'
      },
      'some_id_2': {
        'id': 'some_id_2',
        '__status': { 'isSelected': false },
        'children': [
          'some_id_0',
          'some_id_1'
        ],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_2'
      },
      'some_id_3': {
        'id': 'some_id_3',
        '__status': { 'isSelected': false },
        'children': [],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_3'
      },
      'some_id_4': {
        'id': 'some_id_4',
        '__status': { 'isSelected': false },
        'children': [],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_4'
      },
      'some_id_5': {
        'id': 'some_id_5',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': ['some_id_0'],
        'type': 6,
        'taskID': 'some_id_5'
      },
      'some_id_6': {
        'id': 'some_id_6',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': ['some_id_0'],
        'type': 6,
        'taskID': 'some_id_6'
      }
    }
  },
  'items': {
    'some_id_7': {
      'name': 'First Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        message: 'I am here 1',
        flowInfo: 'true',
        addToFlow: 'true',
      },
      'inputMappings': [],
      'id': 'some_id_7',
      'type': 1,
    },
    'some_id_8': {
      'name': 'Counter1',
      'description': 'Simple Global Counter Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/counter',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        counterName: 'counter1',
        increment: 'true',
        reset: false,
      },
      'inputMappings': [],
      'id': 'some_id_8',
      'type': 1,
    },
    'some_id_9': {
      'name': 'Second Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        message: 'I am here 2',
        flowInfo: 'true',
        addToFlow: 'true',
      },
      'inputMappings': [],
      'id': 'some_id_9',
      'type': 1,
    },
    'some_id_10': {
      'name': 'Third Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        'message': 'I am here 3',
        'flowInfo': 'true',
        'addToFlow': 'true',
      },
      'inputMappings': [],
      'id': 'some_id_10',
      'type': 1,
    },
    'some_id_11': {
      'id': 'some_id_11',
      'type': 3,
      'description': undefined,
      'name': undefined,
      'condition': 'true'
    },
    'some_id_12': {
      'id': 'some_id_12',
      'type': 3,
      'description': undefined,
      'name': undefined,
      'condition': 'false'
    }
  },
  'errorHandler': {
    'name': 'Test flow 1',
    'description': 'Hello world!!',
    'appId': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
    'app': {
      'id': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
      'name': 'Sample Application',
      'normalizedName': 'sample-application',
      'version': '',
      'description': '',
      'createdAt': '2017-03-21T09:43:38.614Z',
      'updatedAt': '2017-03-21T09:43:53.073Z'
    },
    'metadata': {
      'input': [],
      'output': []
    },
    'paths': {
      'root': { 'is': 'some_id_0' },
      'nodes': {
        'some_id_1': {
          'id': 'some_id_1',
          '__status': { 'isSelected': false },
          'children': [],
          'parents': [],
          'type': 5,
          'taskID': 'some_id_1'
        }
      }
    },
    'items': {
      'some_id_2': {
        'name': 'Error Log',
        'description': 'Simple Log Activity',
        return: false,
        'settings': {},
        'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
        '__props': { 'errors': [] },
        '__status': {},
        input: {
          'message': 'Error Log 1',
          'flowInfo': 'true',
          'addToFlow': 'true',
        },
        'inputMappings': [],
        'id': 'some_id_2',
        'type': 1,
      }
    }
  }
};

export let mockResultantUIFlowWithTransformations = {
  'name': 'Test flow 1',
  'description': 'Hello world!!',
  'appId': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
  'app': {
    'id': 'e9712c97-4a9e-4e95-b815-33204ba1fb3a',
    'name': 'Sample Application',
    'normalizedName': 'sample-application',
    'version': '',
    'description': '',
    'createdAt': '2017-03-21T09:43:38.614Z',
    'updatedAt': '2017-03-21T09:43:53.073Z'
  },
  'metadata': {
    'input': [],
    'output': []
  },
  'paths': {
    'root': { 'is': 'some_id_0' },
    'nodes': {
      'some_id_1': {
        'id': 'some_id_1',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': [],
        'type': 5,
        'taskID': 'some_id_1'
      },
      'some_id_2': {
        'id': 'some_id_2',
        '__status': { 'isSelected': false },
        'children': [
          'some_id_0',
          'some_id_1'
        ],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_2'
      },
      'some_id_3': {
        'id': 'some_id_3',
        '__status': { 'isSelected': false },
        'children': [],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_3'
      },
      'some_id_4': {
        'id': 'some_id_4',
        '__status': { 'isSelected': false },
        'children': [],
        'parents': ['some_id_0'],
        'type': 5,
        'taskID': 'some_id_4'
      },
      'some_id_5': {
        'id': 'some_id_5',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': ['some_id_0'],
        'type': 6,
        'taskID': 'some_id_5'
      },
      'some_id_6': {
        'id': 'some_id_6',
        '__status': { 'isSelected': false },
        'children': ['some_id_0'],
        'parents': ['some_id_0'],
        'type': 6,
        'taskID': 'some_id_6'
      }
    }
  },
  'items': {
    'some_id_7': {
      'name': 'First Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        'message': null,
        'flowInfo': 'true',
        'addToFlow': 'true',
      },
      'inputMappings': [
        {
          'type': 1,
          'value': '{T.content}',
          'mapTo': 'message'
        }
      ],
      'id': 'some_id_7',
      'type': 1,
    },
    'some_id_8': {
      'name': 'Counter1',
      'description': 'Simple Global Counter Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/counter',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        'counterName': 'counter1',
        'increment': 'true',
        'reset': false
      },
      'inputMappings': [],
      'id': 'some_id_8',
      'type': 1,
    },
    'some_id_9': {
      'name': 'Second Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        message: 'I am here 2',
        flowInfo: 'true',
        addToFlow: 'true',
      },
      'inputMappings': [],
      'id': 'some_id_9',
      'type': 1,
    },
    'some_id_10': {
      'name': 'Third Log',
      'description': 'Simple Log Activity',
      return: false,
      'settings': {},
      'ref': 'github.com/TIBCOSoftware/flogo-contrib/activity/log',
      '__props': { 'errors': [] },
      '__status': {},
      input: {
        'message': 'I am here 3',
        'flowInfo': 'true',
        'addToFlow': 'true',
      },
      'inputMappings': [],
      'id': 'some_id_10',
      'type': 1,
    },
    'some_id_11': {
      'id': 'some_id_11',
      'type': 3,
      'description': undefined,
      'name': undefined,
      'condition': 'true'
    },
    'some_id_12': {
      'id': 'some_id_12',
      'type': 3,
      'description': undefined,
      'name': undefined,
      'condition': 'false'
    }
  }
};
