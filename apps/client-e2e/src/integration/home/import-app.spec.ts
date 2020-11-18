import { IMPORT_APP, visitApp } from '../../utils';

describe('Import app json', () => {
  before(() => {
    visitApp();
  });

  beforeEach(() => {
    cy.server();
    cy.route({
      method: 'POST',
      url: IMPORT_APP,
    }).as('importApp');
  });

  it('should be able to import legacy flogo application', () => {
    const filePath = 'legacy-app.json';
    importApp(filePath);
    assertSuccessfulAppImport();
  });

  it('should be able to import standard flogo application', () => {
    const filePath = 'standard-app.json';
    importApp(filePath);
    assertSuccessfulAppImport();
  });

  it('should display validation error messages if app failed to import', () => {
    const filePath = 'standard-app-with-errors.json';
    importApp(filePath);
    cy.wait('@importApp').then(() => {
      cy.get('[data-cy=flogo-notification]').contains('Encountered validation errors');
      // closing notification to ensure only one success notification is seen at a time
      cy.get('[data-cy=flogo-notification-close]').click();
      cy.get('[data-cy=flogo-import-error-list]').should('exist');
      cy.get('[data-cy=flogo-import-error-confirm-btn]').click();
    });
  });
});

function importApp(filePath) {
  cy.get('[data-cy=import-app-input]').attachFile(filePath, {
    force: true,
  });
}

function assertSuccessfulAppImport() {
  cy.wait('@importApp').then(() => {
    cy.get('[data-cy=flogo-notification]').contains('Application imported successfully');
    // closing notification to ensure only one success notification is seen at a time
    cy.get('[data-cy=flogo-notification-close]').click();
  });
}
