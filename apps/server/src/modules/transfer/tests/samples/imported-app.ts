export const importedApp = {
  _id: expect.any(String),
  name: 'RestApp',
  type: 'flogo:app',
  version: '0.0.1',
  description: 'My rest app',
  properties: [],
  createdAt: expect.any(String),
  updatedAt: null,
  triggers: [
    expect.objectContaining({
      id: expect.any(String),
      ref: 'github.com/TIBCOSoftware/flogo-contrib/trigger/rest',
      name: 'Receive HTTP Message',
      description: 'Simple REST Trigger',
      createdAt: expect.any(String),
      updatedAt: null,
      settings: {
        port: '9094',
      },
      handlers: [
        expect.objectContaining({
          actionId: expect.any(String),
          settings: {
            method: 'GET',
            path: '/status/:id',
            autoIdReply: null,
            useReplyHandler: 'true',
          },
          actionMappings: {
            input: {
              id: '=$.params.id',
            },
            output: {
              code: '=$.code',
              data: '=$.status',
            },
          },
        }),
      ],
    }),
  ],
  resources: [
    expect.objectContaining({
      id: expect.any(String),
      name: 'GetStatus',
      description: '',
      type: 'flow',
      createdAt: expect.any(String),
      updatedAt: null,
      metadata: expect.objectContaining({
        input: [
          {
            name: 'id',
            type: 'string',
          },
        ],
        output: [
          {
            name: 'status',
            type: 'any',
          },
          {
            name: 'code',
            type: 'integer',
          },
        ],
      }),
      data: expect.any(Object),
    }),
  ],
};
