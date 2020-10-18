import { createApp, visitApp, goBackFromAppsList } from '../utils';
import { generateRandomString } from '../utils';

describe('flogo web apps list page', () => {
  beforeEach(() => {
    visitApp();
    createApp();
  });

  context('checks application name change', () => {
    const updateAppName = 'newAppName';
    it('should update the app name', () => {
      cy.get<string>('@appName').then(appName => {
        goBackFromAppsList();
        cy.contains('[data-cy=app-list-apps]', appName).click();
        cy.get('[data-cy=app-detail-app-name]')
          .clear()
          .type(updateAppName)
          .blur();
        cy.get('[data-cy=app-detail-unique-name-error]').should('not.be.visible');
      });
    });

    it('should error if app name already exist', () => {
      cy.get<string>('@appName').then(appName => {
        goBackFromAppsList();
        const flogoAppName = generateRandomString();
        createApp(flogoAppName);
        goBackFromAppsList();
        cy.contains('[data-cy=app-list-apps]', flogoAppName).click();
        cy.get('[data-cy=app-detail-app-name]')
          .clear()
          .type(appName)
          .blur();
        cy.get('[data-cy=app-detail-unique-name-error]').should('be.visible');
      });
    });
  });

  context.skip('checks resource creation', () => {
    beforeEach(() => {
      cy.get('[data-cy=apps-list-new]').click();
      cy.get('[data-cy=app-detail-app-name]')
        .clear()
        .type(
          Math.random()
            .toString(36)
            .slice(2)
        );
    });

    it('should create a flow', () => {
      const flowName = 'flow example',
        flowDescription = 'flow example description';
      cy.get('[data-cy=app-detail-create-resource]').click();
      cy.get('[data-cy=add-new-resource-name]').type(flowName);
      cy.get('[data-cy=add-new-resource-description]').type(flowDescription);
      cy.get('[data-cy=add-new-resource-create-btn]').click();
      cy.contains(flowName).click();
      cy.contains(flowName).should('be.visible');
    });

    it('should create a stream', () => {
      const streamName = 'stream example',
        streamDescription = 'stream example description';
      cy.get('[data-cy=app-detail-create-resource]').click();
      cy.get('[data-cy=new-resource-type-stream]').click();
      cy.get('[data-cy=add-new-resource-name]').type(streamName);
      cy.get('[data-cy=add-new-resource-description]').type(streamDescription);
      cy.get('[data-cy=add-new-resource-create-btn]').click();
      cy.contains(streamName).click();
      cy.contains(streamName).should('be.visible');
    });
  });
});
