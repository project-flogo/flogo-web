export let resultantFlowModelForCanvas = {
  "flow": {
    "name": "Test flow 1",
    "description": "Hello world!!",
    "appId": "e9712c97-4a9e-4e95-b815-33204ba1fb3a",
    "app": {
      "id": "e9712c97-4a9e-4e95-b815-33204ba1fb3a",
      "name": "Sample Application",
      "normalizedName": "sample-application",
      "version": "",
      "description": "",
      "createdAt": "2017-03-21T09:43:38.614Z",
      "updatedAt": "2017-03-21T09:43:53.073Z"
    },
    "paths": {
      "root": {"is": "some_id_0"},
      "nodes": {
        "some_id_1": {
          "id": "some_id_1",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": [],
          "type": 3,
          "taskID": "some_id_1"
        },
        "some_id_2": {
          "id": "some_id_2",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_2"
        },
        "some_id_3": {
          "id": "some_id_3",
          "__status": {"isSelected": false},
          "children": [
            "some_id_0",
            "some_id_1"
          ],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_3"
        },
        "some_id_4": {
          "id": "some_id_4",
          "__status": {"isSelected": false},
          "children": [],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_4"
        },
        "some_id_5": {
          "id": "some_id_5",
          "__status": {"isSelected": false},
          "children": [],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_5"
        },
        "some_id_6": {
          "id": "some_id_6",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": ["some_id_0"],
          "type": 6,
          "taskID": "some_id_6"
        },
        "some_id_7": {
          "id": "some_id_7",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": ["some_id_0"],
          "type": 6,
          "taskID": "some_id_7"
        }
      }
    },
    "items": {
      "some_id_8": {
        "name": "Trigger Request",
        "title": "Timer",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/trigger/timer",
        "description": "Simple Timer trigger",
        "installed": true,
        "settings": [],
        "outputs": [
          {
            "name": "params",
            "type": 6
          },
          {
            "name": "content",
            "type": 4
          }
        ],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/timer",
        "endpoint": {
          "settings": [
            {
              "name": "repeating",
              "type": "string",
              "value": null
            },
            {
              "name": "startDate",
              "type": "string",
              "value": null
            },
            {
              "name": "hours",
              "type": "string",
              "value": null
            },
            {
              "name": "minutes",
              "type": "string",
              "value": "5"
            },
            {
              "name": "seconds",
              "type": "string",
              "value": null
            }
          ]
        },
        "__props": {"errors": []},
        "__status": {},
        "id": "some_id_8",
        "nodeId": "some_id_8",
        "type": 0,
        "triggerType": "tibco-timer"
      },
      "some_id_9": {
        "name": "First Log",
        "title": "Log Message",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log",
        "description": "Simple Log Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/log",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "message",
              "type": 0,
              "value": "I am here 1",
              "required": false
            },
            {
              "name": "flowInfo",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "addToFlow",
              "type": 3,
              "value": "true",
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "message",
              "type": 0
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_9",
        "type": 1,
        "activityType": "tibco-log"
      },
      "some_id_10": {
        "name": "Counter1",
        "title": "Increment Counter",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/counter",
        "description": "Simple Global Counter Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/counter",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "counterName",
              "type": 0,
              "value": "counter1",
              "required": false
            },
            {
              "name": "increment",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "reset",
              "type": 3,
              "value": false,
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "value",
              "type": 1
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_10",
        "type": 1,
        "activityType": "tibco-counter"
      },
      "some_id_11": {
        "name": "Second Log",
        "title": "Log Message",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log",
        "description": "Simple Log Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/log",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "message",
              "type": 0,
              "value": "I am here 2",
              "required": false
            },
            {
              "name": "flowInfo",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "addToFlow",
              "type": 3,
              "value": "true",
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "message",
              "type": 0
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_11",
        "type": 1,
        "activityType": "tibco-log"
      },
      "some_id_12": {
        "name": "Third Log",
        "title": "Log Message",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log",
        "description": "Simple Log Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/log",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "message",
              "type": 0,
              "value": "I am here 3",
              "required": false
            },
            {
              "name": "flowInfo",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "addToFlow",
              "type": 3,
              "value": "true",
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "message",
              "type": 0
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_12",
        "type": 1,
        "activityType": "tibco-log"
      },
      "some_id_13": {
        "id": "some_id_13",
        "type": 2,
        "description": undefined,
        "name": undefined,
        "condition": "true"
      },
      "some_id_14": {
        "id": "some_id_14",
        "type": 2,
        "description": undefined,
        "name": undefined,
        "condition": "false"
      }
    },
    "errorHandler": {
      "paths": {
        "root": {},
        "nodes": {}
      },
      "items": {}
    }
  },
  "root": {
    "diagram": {
      "root": {"is": "some_id_0"},
      "nodes": {
        "some_id_1": {
          "id": "some_id_1",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": [],
          "type": 3,
          "taskID": "some_id_1"
        },
        "some_id_2": {
          "id": "some_id_2",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_2"
        },
        "some_id_3": {
          "id": "some_id_3",
          "__status": {"isSelected": false},
          "children": [
            "some_id_0",
            "some_id_1"
          ],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_3"
        },
        "some_id_4": {
          "id": "some_id_4",
          "__status": {"isSelected": false},
          "children": [],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_4"
        },
        "some_id_5": {
          "id": "some_id_5",
          "__status": {"isSelected": false},
          "children": [],
          "parents": ["some_id_0"],
          "type": 5,
          "taskID": "some_id_5"
        },
        "some_id_6": {
          "id": "some_id_6",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": ["some_id_0"],
          "type": 6,
          "taskID": "some_id_6"
        },
        "some_id_7": {
          "id": "some_id_7",
          "__status": {"isSelected": false},
          "children": ["some_id_0"],
          "parents": ["some_id_0"],
          "type": 6,
          "taskID": "some_id_7"
        }
      }
    },
    "tasks": {
      "some_id_8": {
        "name": "Trigger Request",
        "title": "Timer",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/trigger/timer",
        "description": "Simple Timer trigger",
        "installed": true,
        "settings": [],
        "outputs": [
          {
            "name": "params",
            "type": 6
          },
          {
            "name": "content",
            "type": 4
          }
        ],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/timer",
        "endpoint": {
          "settings": [
            {
              "name": "repeating",
              "type": "string",
              "value": null
            },
            {
              "name": "startDate",
              "type": "string",
              "value": null
            },
            {
              "name": "hours",
              "type": "string",
              "value": null
            },
            {
              "name": "minutes",
              "type": "string",
              "value": "5"
            },
            {
              "name": "seconds",
              "type": "string",
              "value": null
            }
          ]
        },
        "__props": {"errors": []},
        "__status": {},
        "id": "some_id_8",
        "nodeId": "some_id_8",
        "type": 0,
        "triggerType": "tibco-timer"
      },
      "some_id_9": {
        "name": "First Log",
        "title": "Log Message",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log",
        "description": "Simple Log Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/log",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "message",
              "type": 0,
              "value": "I am here 1",
              "required": false
            },
            {
              "name": "flowInfo",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "addToFlow",
              "type": 3,
              "value": "true",
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "message",
              "type": 0
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_9",
        "type": 1,
        "activityType": "tibco-log"
      },
      "some_id_10": {
        "name": "Counter1",
        "title": "Increment Counter",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/counter",
        "description": "Simple Global Counter Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/counter",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "counterName",
              "type": 0,
              "value": "counter1",
              "required": false
            },
            {
              "name": "increment",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "reset",
              "type": 3,
              "value": false,
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "value",
              "type": 1
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_10",
        "type": 1,
        "activityType": "tibco-counter"
      },
      "some_id_11": {
        "name": "Second Log",
        "title": "Log Message",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log",
        "description": "Simple Log Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/log",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "message",
              "type": 0,
              "value": "I am here 2",
              "required": false
            },
            {
              "name": "flowInfo",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "addToFlow",
              "type": 3,
              "value": "true",
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "message",
              "type": 0
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_11",
        "type": 1,
        "activityType": "tibco-log"
      },
      "some_id_12": {
        "name": "Third Log",
        "title": "Log Message",
        "version": "0.0.1",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log",
        "description": "Simple Log Activity",
        "installed": true,
        "settings": [],
        "outputs": [],
        "ref": "github.com/TIBCOSoftware/flogo-contrib/activity/log",
        "endpoint": {"settings": []},
        "__props": {"errors": []},
        "__status": {},
        "attributes": {
          "inputs": [
            {
              "name": "message",
              "type": 0,
              "value": "I am here 3",
              "required": false
            },
            {
              "name": "flowInfo",
              "type": 3,
              "value": "true",
              "required": false
            },
            {
              "name": "addToFlow",
              "type": 3,
              "value": "true",
              "required": false
            }
          ],
          "outputs": [
            {
              "name": "message",
              "type": 0
            }
          ]
        },
        "inputMappings": [],
        "id": "some_id_12",
        "type": 1,
        "activityType": "tibco-log"
      },
      "some_id_13": {
        "id": "some_id_13",
        "type": 2,
        "description": undefined,
        "name": undefined,
        "condition": "true"
      },
      "some_id_14": {
        "id": "some_id_14",
        "type": 2,
        "description": undefined,
        "name": undefined,
        "condition": "false"
      }
    }
  },
  "errorHandler": {
    "diagram": {
      "root": {},
      "nodes": {}
    },
    "tasks": {}
  }
};
