export function createApp(appName = generateRandomString()) {
  cy.get('[data-cy=apps-list-new]', { timeout: 10000 }).click();
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

export function goBackToAppsList() {
  cy.get('[data-cy=header-back-to-apps-list]').click();
}
