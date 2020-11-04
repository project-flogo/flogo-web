import { createApp, visitApp, createAnAction, Actions } from '../../utils';
import { BaseContributionSchema } from '@flogo-web/core';

describe('Stream designer', () => {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Stream);
  });

  it('List of activities must not contain subflow', () => {
    cy.request(
      'http://localhost:3303/api/v2/contributions/microservices?filter[type]=activity'
    ).then(response => {
      const installedActivities = response?.body?.data || [];
      const SUBFLOW_REF = 'github.com/project-flogo/flow/activity/subflow';
      const subflow = installedActivities.find(
        (activity: BaseContributionSchema) => activity.ref === SUBFLOW_REF
      );
      if (subflow) {
        cy.get('[data-cy=diagram-add-activity-btn]')
          .eq(0)
          .click();
        cy.get('[data-cy=diagram-add-stage-activity-list]').within(() => {
          cy.contains('Start a SubFlow').should('not.exist');
        });
      }
    });
  });

  it('should filter activities when searching for an activity in the search input', () => {
    const SEARCH_ACTIVITY = 'Filter';
    cy.get('[data-cy=diagram-add-activity-btn]')
      .eq(0)
      .click();
    cy.get('[data-cy=diagram-add-stage-search-input]').type(SEARCH_ACTIVITY);
    cy.get('[data-cy=diagram-add-stage-activity-list]').then(() => {
      cy.contains(SEARCH_ACTIVITY).should('exist');
    });
  });

  it('should add a stage to the diagram', () => {
    cy.get('[data-cy=diagram-add-activity-btn]')
      .eq(0)
      .click();
    cy.get('[data-cy=diagram-add-stage-activity]')
      .eq(0)
      .click();
  });

  it('Should not be able to create a branch', () => {
    cy.get('[data-cy=diagram-add-activity-btn]')
      .eq(0)
      .click();
    cy.get('[data-cy=diagram-add-stage-activity]')
      .eq(0)
      .click();
    cy.get('[data-cy=task-toggle-menu-icon]').click();
    cy.get('[data-cy=task-add-branch-icon]').should('not.exist');
  });
});
