import {
  Actions,
  createAnAction,
  createApp,
  getLogButton,
  getLogsWindow,
  navigateToActionPage,
  visitApp,
} from '../../utils';

describe('Logs window', function() {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
    navigateToActionPage();
  });

  it('click on Log button should display log popup', () => {
    getLogButton().click();
    getLogsWindow().should('exist');
  });
});
