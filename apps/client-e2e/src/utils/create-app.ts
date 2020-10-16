export function createApp(appName = generateRandomString()) {
  cy.get('[data-testid=apps-list-new]').click();
  cy.get('[data-testid=flogo-spinner]').should('not.be.visible');
  cy.get('[data-testid=app-detail-app-name]')
    .clear()
    .type(appName)
    .invoke('val')
    .as('appName');
}

function generateRandomString() {
  return Math.random()
    .toString(36)
    .slice(2);
}
