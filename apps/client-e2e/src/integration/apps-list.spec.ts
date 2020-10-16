import { createApp, visitApp } from '../utils';

describe('flogo web apps list page', () => {
  const APP_NAME = 'appName';
  before(() => {
    visitApp();
    createApp();
  });

  context('checks application name change', () => {
    const updateAppName = 'newAppName';
    it('should update the app name', () => {
      cy.get('@appName').then(appName => {
        cy.log(`Random app name is`, appName);
      });
      cy.get('[data-cy=app-detail-go-back]').click();
      cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
      cy.contains('[data-cy=app-list-apps]', APP_NAME).click();
      cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
      cy.get('[data-cy=app-detail-app-name]')
        .clear()
        .type(updateAppName)
        .blur();
      cy.get('[data-cy=app-detail-unique-name-error]').should('not.be.visible');
    });

    it.skip('should update the app name', () => {
      cy.get('[data-cy=app-detail-go-back]').click();
      cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
      cy.contains('[data-cy=app-list-apps]', APP_NAME).click();
      cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
      cy.get('[data-cy=app-detail-app-name]')
        .clear()
        .type(updateAppName);
      cy.get('[data-cy=app-detail-go-back]').click();
      cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
      cy.contains('[data-cy=app-list-apps]', updateAppName);
    });
  });

  context.skip('checks resource creation', () => {
    beforeEach(() => {
      cy.get('[data-cy=apps-list-new]').click();
      cy.get('[data-cy=flogo-spinner]').should('not.be.visible');
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

    /*it('should create a stream', () => {
      const streamName = 'stream example', streamDescription = 'stream example description';
      cy.get('[data-cy=app-detail-create-resource]').click();
      cy.get('[data-cy=new-resource-type-stream]').click();
      cy.get('[data-cy=add-new-resource-name]').type(streamName);
      cy.get('[data-cy=add-new-resource-description]').type(streamDescription);
      cy.get('[data-cy=add-new-resource-create-btn]').click();
      cy.contains(streamName).click();
      cy.contains(streamName).should('be.visible')
    })*/
  });
});
