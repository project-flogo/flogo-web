import {
  createApp,
  visitApp,
  createAnAction,
  goBackToAppsList,
  Actions,
} from '../../utils';
import { BaseContributionSchema } from '@flogo-web/core';

describe('Run a flow', () => {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
  });

  it('should show a dropdown with inputs if Input params are defined for a flow when clicked on Run Flow', () => {
    // add flow inputs/outputs
    const INPUT1 = 'input1';
    const INPUT2 = 'input2';
    cy.get('[data-cy=flow-schema-button]').click();
    cy.get('[data-cy=flow-resource-input-row]')
      .eq(0)
      .within(() => {
        cy.get('[data-cy=flow-resource-input]').type(INPUT1);
      });
    cy.get('[data-cy=flow-resource-add-input-btn]').click();
    cy.get('[data-cy=flow-resource-input-row]')
      .eq(1)
      .within(() => {
        cy.get('[data-cy=flow-resource-input]').type(INPUT2);
        cy.get('[data-cy=resource-type-dropdown-toggle]').click();
        cy.get('[data-cy=resource-type-dropdown]')
          .contains('object')
          .click();
      });
    cy.get('[data-cy=flow-resource-input-modal-save]').click();

    // add an activity
    cy.get('[data-cy=diagram-add-activity-btn]').click();
    cy.get('[data-cy=diagram-add-activity-search-input]').type('log');
    cy.get('[data-cy=diagram-add-activity-activity]')
      .eq(0)
      .click();

    cy.get('[data-cy=run-flow-btn]').click();
    cy.get('[data-cy=dynamic-form-element]')
      .eq(0)
      .within(() => {
        cy.get('[data-cy=dynamic-form-textbox-label]').contains(INPUT1);
      });
    cy.get('[data-cy=dynamic-form-element]')
      .eq(1)
      .within(() => {
        cy.get('[data-cy=dynamic-form-object-label]').contains(INPUT2);
      });
  });

  it('should run a flow', () => {
    // add flow inputs/outputs
    const INPUT = 'flowInput';
    cy.get('[data-cy=flow-schema-button]').click();
    cy.get('[data-cy=flow-resource-input-row]')
      .eq(0)
      .within(() => {
        cy.get('[data-cy=flow-resource-input]').type(INPUT);
      });
    cy.get('[data-cy=flow-resource-input-modal-save]').click();

    // add an activity
    cy.get('[data-cy=diagram-add-activity-btn]').click();
    cy.get('[data-cy=diagram-add-activity-search-input]').type('log');
    cy.get('[data-cy=diagram-add-activity-activity]')
      .eq(0)
      .click();

    // run a flow
    cy.get('[data-cy=run-flow-btn]').click();
    cy.get('[data-cy=dynamic-form-element]')
      .eq(0)
      .within(() => {
        cy.get('[data-cy=dynamic-form-textbox-input]').type('flowInputValue');
      });
    cy.get('[data-cy=run-flow-run-btn]').click();
    cy.get('[data-cy=flogo-notification]', { timeout: 60000 }).contains(
      'Flow completed ^_^'
    );
  });

  it('Run a flow must be disabled in case flow contains a "subflow" activity ', () => {
    // checks if subflow is installed
    cy.request(
      'http://localhost:3303/api/v2/contributions/microservices?filter[type]=activity'
    ).then(response => {
      const installedActivities = response?.body?.data || [];
      const SUBFLOW_REF = 'github.com/project-flogo/flow/activity/subflow';
      const subflow = installedActivities.find(
        (activity: BaseContributionSchema) => activity.ref === SUBFLOW_REF
      );
      if (subflow) {
        // back to app list page and create another flow
        goBackToAppsList();
        createAnAction(Actions.Flow);

        // add subflow
        cy.get('[data-cy=diagram-add-activity-btn]').click();
        cy.get('[data-cy=diagram-add-activity-activity]')
          .eq(0)
          .click();
        cy.get('[data-cy=select-subflow-modal]').within(() => {
          cy.get('[data-cy=flows-list-flow]')
            .eq(0)
            .within(() => {
              cy.get('[data-cy=flows-list-select-flow-btn]').click();
            });
        });
      }
    });
    cy.get('[data-cy=run-flow-btn]').should('be.disabled');
  });
});
