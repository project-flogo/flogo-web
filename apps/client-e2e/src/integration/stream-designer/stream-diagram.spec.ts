import { CONTRIB_REFS } from '@flogo-web/core';
import {
  createApp,
  visitApp,
  createAnAction,
  navigateToActionPage,
  Actions,
  isActivityInstalled,
} from '../../utils';

describe('Stream diagram', () => {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Stream);
    navigateToActionPage();
  });

  it('list of activities must not contain subflow', () => {
    // check if subflow is installed
    isActivityInstalled(CONTRIB_REFS.SUBFLOW).then(isSubFlowInstalled => {
      if (isSubFlowInstalled) {
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
    cy.get('[data-cy=stream-diagram-tile-task]').should('exist');
  });

  it('should not be able to create a branch', () => {
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
