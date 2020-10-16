export function visitApp() {
  cy.visit('/');
  cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
}
