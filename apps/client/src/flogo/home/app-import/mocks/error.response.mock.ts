export const mockImportErrorResponse = [
  {
    status: 400,
    title: 'Validation error',
    detail: 'There were one or more validation problems',
    meta: {
      details: [
        {
          keyword: 'type',
          dataPath: '.name',
          schemaPath: '#/properties/name/type',
          message: 'should be string',
          data: 3543252,
        },
        {
          keyword: 'type',
          dataPath: '.triggers',
          schemaPath: '#/properties/triggers/type',
          message: 'should be array',
          data: {},
        },
        {
          keyword: 'activity-installed',
          message: 'Activity "38756435643" is not installed',
          data: 38756435643,
          dataPath: '.resources[0].data.flow.rootTask.tasks[0].activityRef',
          schemaPath: '#/properties/activityRef/activity-installed',
          params: {
            ref: 'github.com/some/activity',
          },
        },
        {
          keyword: 'if',
          dataPath: '.resources[0].data.flow.rootTask.tasks[0]',
          schemaPath: '#/if',
          params: {
            failingKeyword: 'else',
          },
          message: 'should match "else" schema',
        },
      ],
    },
  },
];
