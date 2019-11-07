import { getGreeting } from '../support/app.po';

context('e2e', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-testid=flogo-spin-loading]').should('not.be.visible');
  });
  it('should display welcome message', () => {
    getGreeting().contains('Welcome back!');
  });

  describe('checks functionality that creates and that deletes an app', () => {
    beforeEach(() => {
      cy.get('[data-testid=apps-list-new]').click();
      cy.get('[data-testid=flogo-spin-loading]').should('not.be.visible');
      cy.get('[data-testid=app-details-app-name]')
        .clear()
        .type(
          Math.random()
            .toString(36)
            .slice(2)
        );
      cy.get('[data-testid=app-details-go-back]').click();
      cy.get('[data-testid=flogo-spin-loading]').should('not.be.visible');
      cy.get('[data-testid=app-details-app]')
        .first()
        .trigger('mouseover')
        .within(() => {
          cy.get('[data-testid=flogo-spin-loading]').should('not.be.visible');
          cy.get('[data-testid=apps-list-app-name]')
            .invoke('text')
            .as('appName');
          cy.get('[data-testid=apps-list-delete-icon]')
            .should('be.hidden')
            .click({ force: true });
          cy.get('[data-testid=flogo-spin-loading]').should('not.be.visible');
          cy.get('[data-testid=apps-list-delete-popover]').should('be.visible');
        })
        .as('deleteAppModal');
    });

    it('should not delete the application when cancel button is clicked', () => {
      cy.get('@deleteAppModal').within(() => {
        cy.get('[data-testid=apps-list-delete-popover-cancel]').click();
      });
      cy.get<string>('@appName').then(appName => {
        cy.contains(appName);
      });
    });

    it('should delete the application when delete button is clicked', () => {
      cy.get('@deleteAppModal').within(() => {
        cy.get('[data-testid=apps-list-delete-popover-delete]').click();
      });
      cy.get('[data-testid=flogo-spin-loading]').should('not.be.visible');
      cy.get<string>('@appName').then(appName => {
        cy.contains(appName).should('not.exist');
      });
    });
  });
});
