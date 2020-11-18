import {
  createApp,
  visitApp,
  goBackFromAppsList,
  createAnAction,
  Actions,
} from '../../utils';

describe('Flogo web apps list page', () => {
  context('Checks application name change', () => {
    beforeEach(() => {
      visitApp();
      createApp();
    });

    it('should update the app name', () => {
      const updateAppName = 'newAppName';
      cy.get<string>('@appName').then(appName => {
        goBackFromAppsList();
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
      cy.get<string>('@appName').then(appName1 => {
        goBackFromAppsList();
        createApp();
        cy.get<string>('@appName').then(appName2 => {
          goBackFromAppsList();
          cy.get('[data-cy=app-list-apps]')
            .contains(appName2)
            .click();
          cy.get('[data-cy=app-detail-app-name-input]')
            .clear()
            .type(appName1)
            .blur();
          cy.get('[data-cy=app-detail-unique-name-error]').should('be.visible');
        });
      });
    });
  });

  context('Checks resource creation', () => {
    before(() => {
      visitApp();
      createApp();
    });

    it('should create a flow', () => {
      const flowName = 'flow example',
        flowDescription = 'flow example description';
      createAnAction(Actions.Flow, flowName, flowDescription);
      cy.contains(flowName).should('be.visible');
    });

    it('should create a stream', () => {
      const streamName = 'stream example',
        streamDescription = 'stream example description';
      createAnAction(Actions.Stream, streamName, streamDescription);
      cy.contains(streamName).should('be.visible');
    });
  });
});
