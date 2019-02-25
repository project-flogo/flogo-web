import { exportApp } from './export-app';
import { FlogoAppModel, App, ContributionSchema, TriggerSchema } from '@flogo-web/core';

test('it exports an app', () => {
  const exported = exportApp(
    getAppToExport(),
    type => {
      return resource => ({
        id: resource.id,
        data: {
          name: resource.name,
        },
      });
    },
    new Map<string, ContributionSchema>(getContributionSchemas())
  );
  expect(exported).toEqual(getExpectedApp());
});

function getAppToExport(): App {
  return {
    id: 'jAnX0TkmL',
    name: 'my cool app',
    type: 'flogo:app',
    version: '',
    description: 'with a description',
    createdAt: '2019-02-15T02:37:52.286Z',
    updatedAt: '2019-02-15T02:53:04.116Z',
    triggers: [
      {
        id: 'UOIarucDh',
        name: 'Receive HTTP Message',
        ref: 'github.com/project-flogo/contrib/trigger/rest',
        description: 'Simple REST Trigger',
        settings: {
          port: 3333,
        },
        createdAt: '2019-02-15T02:42:21.764Z',
        updatedAt: '2019-02-15T02:50:28.358Z',
        handlers: [
          {
            actionId: '9ldwPipJc',
            createdAt: '2019-02-15T02:42:21.779Z',
            updatedAt: '2019-02-15T02:50:28.358Z',
            settings: {
              method: 'GET',
              path: '/test',
            },
            actionMappings: {
              input: {
                in1: '=$.content',
              },
              output: {
                code: 200,
                data: '=$.out1',
              },
            },
            outputs: {},
          },
        ],
      },
    ],
    resources: [
      {
        id: '9ldwPipJc',
        name: 'Some flow',
        type: 'flow',
        createdAt: '2019-02-15T02:38:07.333Z',
        updatedAt: null,
        description: '',
        data: {},
      },
    ],
  };
}

function getExpectedApp(): FlogoAppModel.App {
  return {
    name: 'my cool app',
    type: 'flogo:app',
    version: '0.0.1',
    appModel: '1.0.0',
    description: 'with a description',
    triggers: [
      {
        id: 'receive_http_message',
        ref: 'github.com/project-flogo/contrib/trigger/rest',
        name: 'Receive HTTP Message',
        description: 'Simple REST Trigger',
        settings: {
          port: 3333,
        },
        handlers: [
          {
            action: {
              ref: 'github.com/TIBCOSoftware/flogo-contrib/action/flow',
              data: {
                flowURI: 'res://flow:some_flow',
              },
              input: {
                in1: '=$.content',
              },
              output: {
                code: 200,
                data: '=$.out1',
              },
            },
            settings: {
              method: 'GET',
              path: '/test',
            },
          },
        ],
      },
    ],
    resources: [
      {
        id: 'flow:some_flow',
        data: {
          name: 'Some flow',
        },
      },
    ],
  };
}

function getContributionSchemas(): Array<[string, ContributionSchema]> {
  return [
    [
      'github.com/project-flogo/contrib/trigger/rest',
      {
        name: 'flogo-rest',
        type: 'flogo:trigger',
        version: '0.0.2',
        title: 'Receive HTTP Message',
        description: 'Simple REST Trigger',
        homepage: 'https://github.com/project-flogo/contrib/tree/master/trigger/rest',
        settings: [
          {
            name: 'port',
            type: 'int',
            required: true,
          },
        ],
        output: [
          {
            name: 'pathParams',
            type: 'params',
          },
          {
            name: 'queryParams',
            type: 'params',
          },
          {
            name: 'headers',
            type: 'params',
          },
          {
            name: 'content',
            type: 'any',
          },
        ],
        reply: [
          {
            name: 'code',
            type: 'int',
          },
          {
            name: 'data',
            type: 'any',
          },
        ],
        handler: {
          settings: [
            {
              name: 'method',
              type: 'string',
              required: true,
              allowed: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            },
            {
              name: 'path',
              type: 'string',
              required: true,
            },
          ],
        },
      } as TriggerSchema,
    ],
  ];
}
