import { visitApp } from '../utils';

describe('Import app json', () => {
  before(() => {
    visitApp();
  });

  beforeEach(() => {
    cy.server();
    cy.route({
      method: 'POST',
      url: 'http://localhost:3303/api/v2/apps:import',
    }).as('importApp');
  });

  it('should be able to import legacy V0.5.8 flogo application', () => {
    const filePath = 'flogo-app - v0.5.8.json';
    importApp(filePath);
  });

  it('should be able to import standard V0.9.0 flogo application', () => {
    const filePath = 'flogo-app - v0.9.0.json';
    importApp(filePath);
  });
});

function importApp(filePath) {
  cy.get('[data-cy=import-app-input]').attachFile(filePath, {
    force: true,
  });
  cy.wait('@importApp').then(() => {
    cy.get('[data-cy=flogo-notification]').contains('Application imported successfully');
    // closing notification manually to ensure only one success notification is seen at a time
    cy.get('[data-cy=flogo-notification-close]').click();
  });
}
