export function visitApp() {
  cy.visit('/');
  cy.get('[data-testid=flogo-spinner]').should('not.be.visible');
}
