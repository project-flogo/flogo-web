import { IMPORT_APP, visitApp } from '../../utils';

describe('Import app json', () => {
  beforeEach(() => {
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
      cy.get('[data-cy=flogo-import-error-list]').should('exist');
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
  });
}
