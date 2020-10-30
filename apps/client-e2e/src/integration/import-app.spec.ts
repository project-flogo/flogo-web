import { visitApp } from '../utils';

describe('Import app json', () => {
  before(() => {
    visitApp();
    cy.server();
    cy.route({
      method: 'POST',
      url: 'http://localhost:3303/api/v2/apps:import',
    }).as('importApp');
  });

  it('should be able to import flogo application json', () => {
    const filePath = 'flogo-app.json';
    cy.get('[data-cy=import-app-input]').attachFile(filePath, {
      force: true,
    });
    cy.wait('@importApp').then(() => {
      cy.get('[data-cy=flogo-notification]').contains(
        'Application imported successfully'
      );
    });
  });
});
