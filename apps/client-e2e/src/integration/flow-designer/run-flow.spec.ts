import { CONTRIB_REFS } from '@flogo-web/core';
import {
  createApp,
  visitApp,
  createAnAction,
  goBackFromResourcePage,
  navigateToActionPage,
  isActivityInstalled,
  addActivity,
  Actions,
} from '../../utils';

describe('Run flow', () => {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Flow);
    navigateToActionPage();
  });

  it('should show a dropdown with inputs if "Input params" are defined for a flow when clicked on Run Flow', () => {
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

    addActivity('log');

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

  // this test requires a running instance of flow-store service
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

    addActivity('log');

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

  it('run a flow must be disabled in case flow contains a "subflow" activity ', () => {
    // check if subflow is installed
    isActivityInstalled(CONTRIB_REFS.SUBFLOW).then(isSubFlowInstalled => {
      if (isSubFlowInstalled) {
        // back to app list page and create another flow
        goBackFromResourcePage();
        createAnAction(Actions.Flow);
        navigateToActionPage();

        addActivity();
        cy.get('[data-cy=select-subflow-modal]').within(() => {
          cy.get('[data-cy=flows-list-flow]')
            .eq(0)
            .within(() => {
              cy.get('[data-cy=flows-list-select-flow-btn]').click();
            });
        });
        cy.get('[data-cy=run-flow-btn]').should('be.disabled');
      }
    });
  });
});
