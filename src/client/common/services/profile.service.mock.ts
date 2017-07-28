import {Injectable} from "@angular/core";

@Injectable()
export class  FlogoProfileServiceMock {
  private triggers;
  constructor() {
    this.triggers = [
      {
        "id": "tibco-coap",
        "name": "tibco-coap",
        "version": "0.0.1",
        "title": "Receive CoAP Message",
        "description": "Simple CoAP Trigger",
        "homepage": "",
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/coap",
        "settings": [
          {
            "name": "port",
            "type": "integer",
            "required": true
          }
        ],
        "outputs": [
          {
            "name": "queryParams",
            "type": "params"
          },
          {
            "name": "payload",
            "type": "string"
          }
        ],
        "endpoint": {
          "settings": [
            {
              "name": "method",
              "type": "string",
              "required": true,
              "allowed": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE"
              ]
            },
            {
              "name": "path",
              "type": "string",
              "required": true
            },
            {
              "name": "autoIdReply",
              "type": "boolean"
            }
          ]
        }
      },
      {
        "id": "tibco-mqtt",
        "name": "tibco-mqtt",
        "version": "0.0.1",
        "title": "Receive MQTT Message",
        "description": "Simple MQTT Trigger",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/trigger/mqtt",
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/mqtt",
        "settings": [
          {
            "name": "broker",
            "type": "string"
          },
          {
            "name": "id",
            "type": "string"
          },
          {
            "name": "user",
            "type": "string"
          },
          {
            "name": "password",
            "type": "string"
          },
          {
            "name": "store",
            "type": "string"
          },
          {
            "name": "topic",
            "type": "string"
          },
          {
            "name": "qos",
            "type": "number"
          },
          {
            "name": "cleansess",
            "type": "boolean"
          }
        ],
        "outputs": [
          {
            "name": "message",
            "type": "string"
          }
        ],
        "endpoint": {
          "settings": [
            {
              "name": "topic",
              "type": "string"
            }
          ]
        }
      },
      {
        "id": "tibco-rest",
        "name": "tibco-rest",
        "version": "0.0.1",
        "title": "Receive HTTP Message",
        "description": "Simple REST Trigger",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/trigger/rest",
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/rest",
        "settings": [
          {
            "name": "port",
            "type": "integer",
            "required": true
          }
        ],
        "outputs": [
          {
            "name": "params",
            "type": "params"
          },
          {
            "name": "pathParams",
            "type": "params"
          },
          {
            "name": "queryParams",
            "type": "params"
          },
          {
            "name": "content",
            "type": "object"
          }
        ],
        "endpoint": {
          "settings": [
            {
              "name": "method",
              "type": "string",
              "required": true,
              "allowed": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE"
              ]
            },
            {
              "name": "path",
              "type": "string",
              "required": true
            },
            {
              "name": "autoIdReply",
              "type": "boolean"
            },
            {
              "name": "useReplyHandler",
              "type": "boolean"
            }
          ]
        }
      },
      {
        "id": "tibco-timer",
        "name": "tibco-timer",
        "version": "0.0.1",
        "title": "Timer",
        "description": "Simple Timer trigger",
        "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/trigger/timer",
        "ref": "github.com/TIBCOSoftware/flogo-contrib/trigger/timer",
        "settings": [],
        "outputs": [
          {
            "name": "params",
            "type": "params"
          },
          {
            "name": "content",
            "type": "object"
          }
        ],
        "endpoint": {
          "settings": [
            {
              "name": "repeating",
              "type": "string"
            },
            {
              "name": "startDate",
              "type": "string"
            },
            {
              "name": "hours",
              "type": "string"
            },
            {
              "name": "minutes",
              "type": "string"
            },
            {
              "name": "seconds",
              "type": "string"
            }
          ]
        }
      }
    ]
  }

  getTriggers() {
    return Promise.resolve(this.triggers);
  }

  installTriggers( urls : string[] ) {
    throw new Error('installTriggers not implemented');
  }

}
