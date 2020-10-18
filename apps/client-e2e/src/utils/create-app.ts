export function createApp(appName = generateRandomString()) {
  cy.get('[data-cy=apps-list-new]').click();
  cy.get('[data-cy=app-detail-app-name-input]')
    .clear()
    .type(appName)
    .invoke('val')
    .as('appName');
}

export function generateRandomString() {
  return Math.random()
    .toString(36)
    .slice(2);
}

export function goBackFromAppsList() {
  cy.get('[data-cy=app-detail-go-back]').click();
}
