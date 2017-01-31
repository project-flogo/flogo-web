import { Http,  BaseRequestOptions, Response, ResponseOptions } from '@angular/http';
import { inject, ComponentFixture, TestBed } from '@angular/core/testing';
import { RESTAPIActivitiesService } from './activities-api.service';
import { MockBackend } from '@angular/http/testing';


describe('Service: RESTAPIActivitiesService', ()=> {
    let mockbackend, service = null;
    let mockActivities = {
        data:[
        {
            "name": "sendWSMessage",
            "version": "0.0.1",
            "title": "Send WebSocket Message",
            "description": "This activity sends a message to a WebSocket enabled server like TIBCO eFTL",
            "inputs": [
                {
                    "name": "Server",
                    "type": "string",
                    "value": ""
                },
                {
                    "name": "Channel",
                    "type": "string",
                    "value": ""
                },
                {
                    "name": "Destination",
                    "type": "string",
                    "value": ""
                },
                {
                    "name": "Message",
                    "type": "string",
                    "value": ""
                },
                {
                    "name": "Username",
                    "type": "string",
                    "value": ""
                },
                {
                    "name": "Password",
                    "type": "string",
                    "value": ""
                }
            ],
            "outputs": [
                {
                    "name": "output",
                    "type": "string"
                }
            ]
        },
        {
            "name": "tibco-app",
            "version": "0.0.1",
            "title": "Use Global Attribute",
            "description": "Simple Global App Activity",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/app",
            "inputs": [
                {
                    "name": "attribute",
                    "type": "string",
                    "required": true
                },
                {
                    "name": "operation",
                    "type": "string",
                    "required": true,
                    "allowed": [
                        "ADD",
                        "GET",
                        "UPDATE"
                    ]
                },
                {
                    "name": "type",
                    "type": "string",
                    "allowed": [
                        "string",
                        "integer",
                        "number",
                        "boolean",
                        "object",
                        "array",
                        "params"
                    ]
                },
                {
                    "name": "value",
                    "type": "any"
                }
            ],
            "outputs": [
                {
                    "name": "value",
                    "type": "any"
                }
            ]
        },
        {
            "name": "tibco-awsiot",
            "version": "0.0.1",
            "title": "Update AWS Device Shadow",
            "description": "Simple AWS IoT",
            "inputs": [
                {
                    "name": "thingName",
                    "type": "string",
                    "required": true
                },
                {
                    "name": "awsEndpoint",
                    "type": "string",
                    "required": true
                },
                {
                    "name": "desired",
                    "type": "params"
                },
                {
                    "name": "reported",
                    "type": "params"
                }
            ]
        },
        {
            "name": "tibco-coap",
            "version": "0.0.1",
            "title": "Send CoAP Message",
            "description": "Simple CoAP Activity",
            "inputs": [
                {
                    "name": "uri",
                    "type": "string",
                    "required": true
                },
                {
                    "name": "method",
                    "type": "string",
                    "required": true,
                    "allowed": [
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE"
                    ]
                },
                {
                    "name": "queryParams",
                    "type": "params"
                },
                {
                    "name": "type",
                    "type": "string"
                },
                {
                    "name": "messageId",
                    "type": "integer"
                },
                {
                    "name": "options",
                    "type": "params"
                },
                {
                    "name": "payload",
                    "type": "string"
                }
            ],
            "outputs": [
                {
                    "name": "response",
                    "type": "string"
                }
            ]
        },
        {
            "name": "tibco-counter",
            "version": "0.0.1",
            "title": "Increment Counter",
            "description": "Simple Global Counter Activity",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/counter",
            "inputs": [
                {
                    "name": "counterName",
                    "type": "string",
                    "required": true
                },
                {
                    "name": "increment",
                    "type": "boolean"
                },
                {
                    "name": "reset",
                    "type": "boolean"
                }
            ],
            "outputs": [
                {
                    "name": "value",
                    "type": "integer"
                }
            ]
        },
        {
            "name": "tibco-error",
            "version": "0.0.1",
            "title": "Throw Error",
            "description": "Simple Error Activity",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/error",
            "inputs": [
                {
                    "name": "message",
                    "type": "string"
                },
                {
                    "name": "data",
                    "type": "object"
                }
            ],
            "outputs": []
        },
        {
            "name": "tibco-gpio",
            "version": "0.0.1",
            "title": "Control GPIO",
            "description": "Control raspberry gpio",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/gpio",
            "inputs": [
                {
                    "name": "method",
                    "type": "string",
                    "required": true,
                    "allowed": [
                        "Direction",
                        "Set State",
                        "Read State",
                        "Pull"
                    ]
                },
                {
                    "name": "pinNumber",
                    "type": "integer",
                    "required": true
                },
                {
                    "name": "direction",
                    "type": "string",
                    "allowed": [
                        "Input",
                        "Output"
                    ]
                },
                {
                    "name": "state",
                    "type": "string",
                    "allowed": [
                        "High",
                        "Low"
                    ]
                },
                {
                    "name": "Pull",
                    "type": "string",
                    "allowed": [
                        "Up",
                        "Down",
                        "Off"
                    ]
                }
            ],
            "outputs": [
                {
                    "name": "result",
                    "type": "integer"
                }
            ]
        },
        {
            "name": "tibco-log",
            "version": "0.0.1",
            "title": "Log Message",
            "description": "Simple Log Activity",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/log",
            "inputs": [
                {
                    "name": "message",
                    "type": "string",
                    "value": ""
                },
                {
                    "name": "flowInfo",
                    "type": "boolean",
                    "value": "true"
                },
                {
                    "name": "addToFlow",
                    "type": "boolean",
                    "value": "true"
                }
            ],
            "outputs": [
                {
                    "name": "message",
                    "type": "string"
                }
            ]
        },
        {
            "name": "tibco-reply",
            "version": "0.0.1",
            "title": "Reply To Trigger",
            "description": "Simple Reply Activity",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/reply",
            "inputs": [
                {
                    "name": "code",
                    "type": "integer",
                    "required": true
                },
                {
                    "name": "data",
                    "type": "any"
                }
            ],
            "outputs": []
        },
        {
            "name": "tibco-rest",
            "version": "0.0.1",
            "title": "Invoke REST Service",
            "description": "Simple REST Activity",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/rest",
            "inputs": [
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
                    "name": "uri",
                    "type": "string",
                    "required": true
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
            "outputs": [
                {
                    "name": "result",
                    "type": "any"
                }
            ]
        },
        {
            "name": "tibco-twilio",
            "version": "0.0.1",
            "title": "Send SMS Via Twilio",
            "description": "Simple Twilio Activity",
            "homepage": "https://github.com/TIBCOSoftware/flogo-contrib/tree/master/activity/twilio",
            "inputs": [
                {
                    "name": "accountSID",
                    "type": "string"
                },
                {
                    "name": "authToken",
                    "type": "string"
                },
                {
                    "name": "from",
                    "type": "string"
                },
                {
                    "name": "to",
                    "type": "string"
                },
                {
                    "name": "message",
                    "type": "string"
                }
            ],
            "outputs": []
        }
    ]};

    beforeEach(()=> {
        TestBed.configureTestingModule({
            providers: [
                MockBackend,
                BaseRequestOptions,
                {
                    provide: Http,
                    useFactory: (backendInstance: MockBackend, defaultOptions: BaseRequestOptions) => {
                        return new Http(backendInstance, defaultOptions);
                    },
                    deps: [MockBackend, BaseRequestOptions]
                },
                RESTAPIActivitiesService
            ]
        })

    });

    beforeEach(inject([RESTAPIActivitiesService, MockBackend], (serviceAPI: RESTAPIActivitiesService, mock: MockBackend)=> {
        service = serviceAPI;
        mockbackend = mock;
    }));


    it('Should transform the 11 activities', (done)=> {
        mockbackend.connections.subscribe(connection => {
            let options = new ResponseOptions({body: JSON.stringify(mockActivities)});
            connection.mockRespond(new Response(options));
        });

        service.getActivities()
            .then((res)=> {
                expect(res.length).toEqual(11);
                done();
        });

    });

    it('Should add the "installed" field to all items', (done)=> {
        mockbackend.connections.subscribe(connection => {
            let options = new ResponseOptions({body: JSON.stringify(mockActivities)});
            connection.mockRespond(new Response(options));
        });

        service.getActivities()
            .then((res)=> {
                let installed = (res || []).filter((item) => item['installed'] === true);

                expect(installed.length).toEqual(11);
                done();
        });
    });

});


