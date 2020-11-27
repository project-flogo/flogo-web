import {
  createAnAction,
  createApp,
  goBackFromResourcePage,
  visitApp,
  navigateToActionPage,
  formEndPoint,
  addActivity,
  Actions,
  SHIM_BUILD_API,
} from '../../utils';

describe('Build the application', function() {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
    navigateToActionPage();
  });

  it('should build the application', () => {
    addActivity('channel');
    addActivity('log');

    cy.get('[data-cy=triggers-add-trigger-btn]').click();
    cy.get('[data-cy=triggers-list]')
      .contains('Receive HTTP Message')
      .click();
    goBackFromResourcePage();
    cy.get('[data-cy=app-detail-build-app-btn]').click();

    // finding app name from url to pass it as route param
    let appName;
    cy.url().then(url => {
      appName = url.split('/').pop();

      // facing an issue when trying to build app through UI by button click,
      // hence making an explicit server request to build the app
      cy.request({
        url: formEndPoint(`/apps/${appName}/build?os=windows&arch=amd64`),
        timeout: 120000, // build app API request takes longer item hence overriding request timeout time
      }).then(response => {
        expect(response.status).equal(200);
      });
    });
  });

  it('should match the expected API pattern when building an application using shim option', () => {
    cy.server();
    cy.route({
      method: 'GET',
      url: SHIM_BUILD_API,
      response: {
        status: 200,
      },
    }).as('shimBuildAPI');

    addActivity('log');
    addActivity('channel');

    cy.get('[data-cy=triggers-add-trigger-btn]').click();
    cy.get('[data-cy=triggers-list]')
      .contains('CLI Trigger')
      .click();
    goBackFromResourcePage();

    cy.get('[data-cy=app-detail-build-app-btn]').click();
    cy.get('[data-cy=shim-trigger-options-dropdown-list]').within(() => {
      cy.contains('CLI App').click();
    });
    cy.get('[data-cy=shim-build-options-dropdown-list]').within(() => {
      cy.contains('Windows/amd64').click();
    });
    cy.wait('@shimBuildAPI').then(response => {
      expect(response.status).equal(200);
    });
  });
});
