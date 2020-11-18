import {
  createAnAction,
  createApp,
  visitApp,
  goBackFromResourcePage,
  Actions,
  navigateToActionPage,
} from '../../utils';

describe('Export app', function() {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
    navigateToActionPage();
  });

  it('should export the whole application', () => {
    cy.server();
    cy.route({
      method: 'GET',
      url: 'http://localhost:3303/api/v2/apps/*:export',
    }).as('exportApp');

    cy.get('[data-cy=diagram-add-activity-btn]').click();
    cy.get('[data-cy=diagram-add-activity-search-input]').type('log');
    cy.get('[data-cy=diagram-add-activity-activity]')
      .eq(0)
      .click();
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
      url: 'http://localhost:3303/api/v2/apps/*:export?type=flows',
    }).as('exportActions');

    cy.get('[data-cy=diagram-add-activity-btn]').click();
    cy.get('[data-cy=diagram-add-activity-search-input]').type('log');
    cy.get('[data-cy=diagram-add-activity-activity]')
      .eq(0)
      .click();
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
    cy.get('[data-cy=diagram-add-activity-btn]').click();
    cy.get('[data-cy=diagram-add-activity-search-input]').type('log');
    cy.get('[data-cy=diagram-add-activity-activity]')
      .eq(0)
      .click();
    goBackFromResourcePage();
    cy.get('[data-cy=app-detail-export-button]').click();
    cy.get('[data-cy=app-detail-export-app]').click();
  });
});
