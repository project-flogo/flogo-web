import {
  createAnAction,
  createApp,
  visitApp,
  goBackFromResourcePage,
  navigateToActionPage,
  Actions,
  EXPORT_APP,
  EXPORT_ACTIONS,
  addActivity,
} from '../../utils';

describe('Export app', function() {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
    navigateToActionPage();
  });

  it('should export the entire application', () => {
    cy.server();
    cy.route({
      method: 'GET',
      url: EXPORT_APP,
    }).as('exportApp');

    addActivity('log');
    cy.get('[data-cy=triggers-add-trigger-btn]').click();
    cy.get('[data-cy=triggers-list-trigger]')
      .eq(0)
      .click();
    goBackFromResourcePage();
    cy.get('[data-cy=app-detail-export-button]').click();
    cy.get('[data-cy=app-detail-export-app]').click();
    cy.wait('@exportApp').then(response => {
      expect(response.status).equal(200);
    });
  });

  it('should export the actions', () => {
    cy.server();
    cy.route({
      method: 'GET',
      url: EXPORT_ACTIONS,
    }).as('exportActions');

    addActivity('log');
    cy.get('[data-cy=triggers-add-trigger-btn]').click();
    cy.get('[data-cy=triggers-list-trigger]')
      .eq(0)
      .click();
    goBackFromResourcePage();
    cy.get('[data-cy=app-detail-export-button]').click();
    cy.get('[data-cy=app-detail-export-actions]').click();
    cy.get('[data-cy=export-actions-btn]').click();
    cy.wait('@exportActions').then(response => {
      expect(response.status).equal(200);
    });
  });

  it('should warn users exporting application with no triggers', () => {
    addActivity('log');
    goBackFromResourcePage();
    cy.get('[data-cy=app-detail-export-button]').click();
    cy.get('[data-cy=app-detail-export-app]').click();
  });
});
