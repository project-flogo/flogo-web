import { visitApp, createApp, goBackFromAppsList } from '../utils';

describe('flogo web landing page', () => {
  before(() => {
    visitApp();
  });

  context('checks the greet message', () => {
    it('should display welcome message', () => {
      cy.get('[data-cy=welcome-message]').contains('Welcome back!!');
    });
  });

  context('checks functionality that creates and that deletes an app', () => {
    beforeEach(() => {
      createApp();
      goBackFromAppsList();
      cy.get('[data-cy=app-list-app]')
        .first()
        .trigger('mouseover')
        .within(() => {
          cy.get('[data-cy=apps-list-app-name]')
            .invoke('text')
            .as('appName');
          cy.get('[data-cy=apps-list-delete-icon]')
            .should('be.hidden')
            .click({ force: true });
          cy.get('[data-cy=apps-list-delete-popover]').should('be.visible');
        })
        .as('deleteAppModal');
    });

    it('should not delete the application when cancel button is clicked', () => {
      cy.get('@deleteAppModal').within(() => {
        cy.get('[data-cy=apps-list-delete-popover-cancel]').click();
      });
      cy.get<string>('@appName').then(appName => {
        cy.contains(appName);
      });
    });

    it('should delete the application when delete button is clicked', () => {
      cy.get('@deleteAppModal').within(() => {
        cy.get('[data-cy=apps-list-delete-popover-delete]').click();
      });
      cy.get<string>('@appName').then(appName => {
        cy.contains(appName).should('not.exist');
      });
    });
  });
});
