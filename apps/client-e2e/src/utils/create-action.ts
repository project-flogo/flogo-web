import { generateRandomString } from './create-app';

export enum Actions {
  Flow,
  Stream,
}

export function createAnAction(actionType, actionName = generateRandomString()) {
  cy.get('[data-cy=app-detail-create-resource]').click();
  if (actionType === Actions.Stream) {
    cy.get('[data-cy=resource-types]')
      .contains('Stream')
      .click();
  }
  cy.get('[data-cy=add-new-resource-name]').type(actionName);
  cy.get('[data-cy=add-new-resource-create-btn]').click();
  cy.contains(actionName).click();
}
