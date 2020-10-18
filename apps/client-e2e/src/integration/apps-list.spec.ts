import { createApp, visitApp, goBackFromAppsList } from '../utils';
import { generateRandomString } from '../utils';

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
        cy.get('[data-cy=app-list-apps]').contains(appName).click();
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
        cy.get('[data-cy=app-list-apps]').contains(flogoAppName).click();
        cy.get('[data-cy=app-detail-app-name-input]')
          .clear()
          .type(appName)
          .blur();
        cy.get('[data-cy=app-detail-unique-name-error]').should('be.visible');
      });
    });
  });
});
