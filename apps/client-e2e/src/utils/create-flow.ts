import { generateRandomString } from './create-app';

export function createAFlow(flowName = generateRandomString()) {
  cy.get('[data-cy=app-detail-create-resource]').click();
  cy.get('[data-cy=add-new-resource-name]').type(flowName);
  cy.get('[data-cy=add-new-resource-create-btn]').click();
  cy.contains(flowName).click();
}
