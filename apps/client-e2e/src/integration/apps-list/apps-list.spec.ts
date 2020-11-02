import {
  createApp,
  visitApp,
  goBackFromAppsList,
  generateRandomString,
} from '../../utils';

describe('flogo web apps list page', () => {
  context('checks application name change', () => {
    beforeEach(() => {
      visitApp();
      createApp();
    });

    it('should update the app name', () => {
      const updateAppName = 'newAppName';
      cy.get<string>('@appName').then(appName => {
        goBackFromAppsList();
        cy.log('app name is', appName);
        cy.get('[data-cy=app-list-apps]')
          .contains(appName)
          .click();
        cy.get('[data-cy=app-detail-app-name-input]')
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
        cy.get('[data-cy=app-list-apps]')
          .contains(flogoAppName)
          .click();
        cy.get('[data-cy=app-detail-app-name-input]')
          .clear()
          .type(appName)
          .blur();
        cy.get('[data-cy=app-detail-unique-name-error]').should('be.visible');
      });
    });
  });

  context('checks resource creation', () => {
    before(() => {
      visitApp();
      createApp();
    });

    it('should create a flow', () => {
      const flowName = 'flow example',
        flowDescription = 'flow example description';
      cy.get('[data-cy=app-detail-create-resource]').click();
      cy.get('[data-cy=add-new-resource-name]').type(flowName);
      cy.get('[data-cy=add-new-resource-description]').type(flowDescription);
      cy.get('[data-cy=add-new-resource-create-btn]').click();
      cy.contains(flowName).should('be.visible');
    });

    it('should create a stream', () => {
      const streamName = 'stream example',
        streamDescription = 'stream example description';
      cy.get('[data-cy=app-detail-create-resource]').click();
      cy.get('[data-cy=resource-types]')
        .contains('Stream')
        .click();
      cy.get('[data-cy=add-new-resource-name]').type(streamName);
      cy.get('[data-cy=add-new-resource-description]').type(streamDescription);
      cy.get('[data-cy=add-new-resource-create-btn]').click();
      cy.contains(streamName).should('be.visible');
    });
  });
});
