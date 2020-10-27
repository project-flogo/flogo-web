import { createApp, visitApp, createAFlow } from '../../utils';

describe('flogo web flow designer trigger panel', () => {
  before(() => {
    visitApp();
    createApp();
    createAFlow();
  });

  it('should display triggers modal with triggers list on clicking add trigger button', () => {
    cy.get('[data-cy=triggers-add-trigger-btn]').click();
    cy.get('[data-cy=triggers-list-trigger]').should('exist');
    cy.get('body').type('{esc}');
  });

  it('should add trigger to triggers panel on selecting a trigger in triggers modal', () => {
    cy.get('[data-cy=triggers-add-trigger-btn]').click();
    cy.get('[data-cy=triggers-list-trigger]')
      .eq(0)
      .click();
    cy.get('[data-cy=triggers-trigger-block]').should('exist');
  });

  it('should allow to add multiple triggers for a resource', () => {
    for (let i = 0; i < 3; i++) {
      cy.get('[data-cy=triggers-add-trigger-btn]').click();
      cy.get('[data-cy=triggers-create-new-trigger]').click();
      cy.get('[data-cy=triggers-list-trigger]')
        .eq(i)
        .click();
    }
    cy.get('[data-cy=triggers-trigger-block]').then(addedTriggers =>
      expect(addedTriggers.length).greaterThan(1)
    );
  });
});
