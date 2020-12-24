import { INSTALL_CONTRIBUTION, pressEscapeKey, visitApp } from '../../utils';

describe('Contribution installation', () => {
  beforeEach(() => {
    visitApp();
    cy.server();
    cy.route({
      method: 'POST',
      url: INSTALL_CONTRIBUTION,
    }).as('contribInstall');
  });

  it('should display a popup with URL input box, install and cancel buttons when clicked on "Install contribution" button on the top right of the page', () => {
    cy.get('[data-cy=install-contrib-btn]').click();
    cy.get('[data-cy=install-contrib-modal]').should('exist');
    cy.get('[data-cy=install-contrib-url-input]').should('exist');
    cy.get('[data-cy=install-contrib-cancel-btn]').should('exist');
    cy.get('[data-cy=install-contrib-install-btn]').should('exist');
    pressEscapeKey();
  });

  it('should be able to install an activity', () => {
    const INSTALL_ACTIVITY_REF = 'github.com/project-flogo/contrib/activity/log';
    cy.get('[data-cy=install-contrib-btn]').click();
    cy.get('[data-cy=install-contrib-url-input]').type(INSTALL_ACTIVITY_REF);
    cy.get('[data-cy=install-contrib-install-btn]').click();
    cy.wait('@contribInstall').then(() => {
      cy.get('[data-cy=install-contrib-success]').should('exist');
      cy.get('[data-cy=install-contrib-success-okay-btn]').click();
    });
  });

  it('should be able to install a trigger', () => {
    const INSTALL_TRIGGER_REF = 'github.com/project-flogo/contrib/trigger/cli';
    cy.get('[data-cy=install-contrib-btn]').click();
    cy.get('[data-cy=install-contrib-url-input]').type(INSTALL_TRIGGER_REF);
    cy.get('[data-cy=install-contrib-install-btn]').click();
    cy.wait('@contribInstall').then(() => {
      cy.get('[data-cy=install-contrib-success]').should('exist');
      cy.get('[data-cy=install-contrib-success-okay-btn]').click();
    });
  });
});
