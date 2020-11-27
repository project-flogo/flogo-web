import { generateRandomString } from './generate-random-string';

export function createApp(appName = generateRandomString()) {
  cy.get('[data-cy=apps-list-new]').click();
  cy.get('[data-cy=app-detail-app-name-input]')
    .clear()
    .type(appName)
    .invoke('val')
    .as('appName');
}

export function goBackFromAppsList() {
  cy.get('[data-cy=app-detail-go-back]').click();
}

export function goBackFromResourcePage() {
  cy.get('[data-cy=header-back-to-apps-list]').click();
}
