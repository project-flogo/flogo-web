import {
  Actions,
  createAnAction,
  createApp,
  navigateToActionPage,
  visitApp,
} from '../../utils';

describe('Error handler tab', () => {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
    navigateToActionPage();
  });

  it('Should have error handler tab', () => {
    cy.get('[data-cy=error-handler-tab]').should('exist');
  });
});
