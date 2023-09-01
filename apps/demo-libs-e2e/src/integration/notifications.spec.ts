describe('Notifications Lib', () => {
  beforeEach(() => {
    cy.visit('/notifications');
  });

  it('shows success notifications', () => {
    cy.get('[data-cy="btn-success"').click();
    cy.get('[data-notification-type="success"]')
      .should('be.visible')
      .contains('Woohoo!');
  });

  it('shows error notifications', () => {
    cy.get('[data-cy="btn-error"').click();
    cy.get('[data-notification-type="error"]')
      .should('be.visible')
      .contains('Oh no');
  });

  it('shows more than one notification at a time', () => {
    cy.get('[data-cy="btn-many"').click();
    cy.get('[data-notification-type]').should('have.length', 3);
  });

  specify('notifications dissapear after some time', () => {
    cy.get('[data-cy="inputTimeout"]')
      .clear()
      .type('100');
    cy.get('[data-cy="btn-timeout"]').click();
    cy.get('[data-notification-type]').should('be.visible');
    cy.get('[data-notification-type]').should('not.be.visible');
  });
});
