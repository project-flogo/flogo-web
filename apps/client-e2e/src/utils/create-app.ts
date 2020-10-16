export function createApp(appName = generateRandomString()) {
  cy.get('[data-cy=apps-list-new]').click();
  cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
  cy.get('[data-cy=app-detail-app-name]')
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
