import { pick } from 'lodash';
import { prepareUpdateQuery } from './prepare-update-query';

describe('resources: prepareUpdateQuery', () => {
  const MockOldResourceData = {
    name: 'sample',
    metadata: {},
    data: { sample: true },
  };
  const MockNewResourceData = {
    name: 'sample new',
    metadata: {},
    data: { sample: true },
  };

  it('should create proper query for an resource to update the db', () => {
    const query = prepareUpdateQuery(MockNewResourceData, MockOldResourceData, 1);
    expect(query).toHaveProperty('$set');
    expect(query).not.toHaveProperty('$unset');
    expect(query.$set).toHaveProperty(['resources.1.name'], 'sample new');
    expect(Object.keys(query.$set)).toEqual(
      expect.arrayContaining(['resources.1.metadata', 'resources.1.data'])
    );
  });
});
