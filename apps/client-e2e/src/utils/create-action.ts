import { generateRandomString } from './generate-random-string';

export enum Actions {
  Flow,
  Stream,
}

export function createAnAction(
  actionType,
  actionName = generateRandomString(),
  actionDescription?
) {
  cy.get('[data-cy=app-detail-create-resource]').click();
  if (actionType === Actions.Stream) {
    cy.get('[data-cy=resource-types]')
      .contains('Stream', { timeout: 10000 })
      .click();
  }
  cy.get('[data-cy=add-new-resource-name]')
    .type(actionName)
    .invoke('val')
    .as('actionName');
  if (actionDescription) {
    cy.get('[data-cy=add-new-resource-description]').type(actionDescription);
  }
  cy.get('[data-cy=add-new-resource-create-btn]').click();
}

export function navigateToActionPage() {
  cy.get<string>('@actionName').then(actionName => {
    cy.contains(actionName).click();
  });
}
