import {
  createApp,
  visitApp,
  createAnAction,
  pressEscapeKey,
  Actions,
  navigateToActionPage,
} from '../../utils';
import { BaseContributionSchema } from '@flogo-web/core';

describe('Flow diagram', () => {
  before(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
    navigateToActionPage();
  });

  it('should display popup with list of activities when + button is clicked', () => {
    cy.get('[data-cy=diagram-add-activity-btn]').click();
    cy.get('[data-cy=diagram-add-activity-popup]').should('be.visible');
    cy.get('[data-cy=diagram-add-activity-activity]').then(activityElements => {
      expect(activityElements.length).greaterThan(0);
    });
    pressEscapeKey();
  });

  it('should display subflow on the top of the activities list if subflow is installed', () => {
    cy.request(
      'http://localhost:3303/api/v2/contributions/microservices?filter[type]=activity'
    ).then(response => {
      const installedActivities = response?.body?.data || [];
      const SUBFLOW_REF = 'github.com/project-flogo/flow/activity/subflow';
      const subflow = installedActivities.find(
        (activity: BaseContributionSchema) => activity.ref === SUBFLOW_REF
      );
      if (subflow) {
        cy.get('[data-cy=diagram-add-activity-btn]').click();
        cy.get('[data-cy=diagram-add-activity-activity]')
          .eq(0)
          .contains('SubFlow');
        pressEscapeKey();
      }
    });
  });

  it('should add an activity to the diagram', () => {
    cy.get('[data-cy=diagram-add-activity-btn]').click();
    cy.get('[data-cy=diagram-add-activity-search-input]').type('log');
    cy.get('[data-cy=diagram-add-activity-activity]')
      .eq(0)
      .click();
    cy.get('[data-cy=flow-diagram-tile-task]').should('exist');
  });

  it('should filter activities when searching for an activity in the search input', () => {
    const SEARCH_ACTIVITY = 'Log';
    cy.get('[data-cy=diagram-add-activity-btn]')
      .eq(0)
      .click();
    cy.get('[data-cy=diagram-add-activity-search-input]').type(SEARCH_ACTIVITY);
    cy.get('[data-cy=diagram-add-activity-activity]')
      .eq(0)
      .contains(SEARCH_ACTIVITY);
    pressEscapeKey();
  });
});
