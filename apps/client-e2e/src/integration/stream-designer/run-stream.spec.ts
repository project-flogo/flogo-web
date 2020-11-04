import { createAnAction, createApp, visitApp, Actions } from '../../utils';

describe('Run stream', function() {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Stream);

    cy.server();
    cy.route({
      method: 'POST',
      url: 'http://localhost:3303/api/v2/upload/simulationData',
    }).as('uploadStreamInput');
  });

  it('Should be able to upload a stream input csv file', () => {
    cy.get('[data-cy=diagram-add-activity-btn]')
      .eq(0)
      .click();
    cy.get('[data-cy=diagram-add-stage-activity]')
      .eq(0)
      .click();
    cy.get('[data-cy=simulation-ctrls-open-run-stream]').click();
    uploadStreamInputFile();
    cy.wait('@uploadStreamInput').then(() => {
      cy.get('[data-cy=stream-input-upload-status]').within(() => {
        cy.get('[data-cy=uploaded]').should('exist');
      });
    });
  });

  it('Should be able to remove the stream input csv file', () => {
    cy.get('[data-cy=diagram-add-activity-btn]')
      .eq(0)
      .click();
    cy.get('[data-cy=diagram-add-stage-activity]')
      .eq(0)
      .click();
    cy.get('[data-cy=simulation-ctrls-open-run-stream]').click();
    uploadStreamInputFile();
    cy.wait('@uploadStreamInput').then(() => {
      cy.get('[data-cy=stream-input-upload-status]').within(() => {
        cy.get('[data-cy=uploaded]').click();
      });
    });
    cy.get('[data-cy=upload-stream-data-input]').should('exist');
  });

  it('Should be able to start simulation', () => {
    startSimulation();
    // override selector query retry timeout, until buttons visible
    cy.get('[data-cy=simulation-ctrls-stop-btn]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy=simulation-ctrls-pause-btn]').should('exist');
  });
});

/*
 * Add and configure stages,
 * upload stream input data and
 * run stream simulation
 * */
function startSimulation() {
  // add stages
  cy.get('[data-cy=diagram-add-activity-btn]')
    .eq(0)
    .click();
  cy.get('[data-cy=diagram-add-stage-search-input]').type('Log');
  cy.get('[data-cy=diagram-add-stage-activity]')
    .eq(0)
    .click();

  cy.get('[data-cy=diagram-add-activity-btn]')
    .eq(0)
    .click();
  cy.get('[data-cy=diagram-add-stage-search-input]').type('Filter');
  cy.get('[data-cy=diagram-add-stage-activity]')
    .eq(0)
    .click();

  // configure stream interface
  const INPUT = 'input';
  const OUTPUT = 'output';
  cy.get('[data-cy=stream-params-schema-button]').click();
  cy.get('[data-cy=stream-resource-input-row]')
    .eq(0)
    .within(() => {
      cy.get('[data-cy=stream-resource-input]').type(INPUT);
    });
  cy.get('[data-cy=stream-resource-output-tab]').click();
  cy.get('[data-cy=stream-resource-output-row]')
    .eq(0)
    .within(() => {
      cy.get('[data-cy=stream-resource-input]').type(OUTPUT);
    });
  cy.get('[data-cy=stream-resource-interface-modal-save]').click();

  // configure stages
  cy.get('[data-cy=stream-diagram-stage]')
    .eq(0)
    .within(() => {
      cy.get('[data-cy=task-toggle-menu-icon]').click();
      cy.get('[data-cy=task-configure-icon]').click();
    });
  cy.get('[data-cy=stream-stage-configurator]').within(() => {
    // configure stage inputs
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get('[data-cy=message]').click();
    });
    cy.get('[data-cy=flogo-mapper-editor]')
      .click()
      .type(`$pipeline.${INPUT}`);

    // configure stage outputs
    cy.get('[data-cy=outputMappings]').click();
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get(`[data-cy="pipeline.${OUTPUT}"]`).click();
    });
    cy.get('[data-cy=flogo-mapper-editor]')
      .click()
      .type('"some output"');
    cy.get('[data-cy=stage-configurator-save-btn]').click();
  });

  cy.get('[data-cy=stream-diagram-stage]')
    .eq(1)
    .within(() => {
      cy.get('[data-cy=task-toggle-menu-icon]').click();
      cy.get('[data-cy=task-configure-icon]').click();
    });
  cy.get('[data-cy=stream-stage-configurator]').within(() => {
    // configure stage settings
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get('[data-cy=type]').click();
    });
    cy.get('[data-cy=flogo-mapper-editor]')
      .click()
      .type('"non-zero"');
    // configure stage inputs
    cy.get('[data-cy=inputMappings]').click();
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get('[data-cy=value]').click();
    });
    cy.get('[data-cy=flogo-mapper-editor]')
      .click()
      .type(`$pipeline.${INPUT}`);

    // configure stage outputs
    cy.get('[data-cy=outputMappings]').click();
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get(`[data-cy="pipeline.${OUTPUT}"]`).click();
    });
    cy.get('[data-cy=flogo-mapper-editor]')
      .click()
      .type('$.value');
    cy.get('[data-cy=stage-configurator-save-btn]').click();
  });

  // open run stream modal, upload input csv file and run simulation
  cy.get('[data-cy=simulation-ctrls-open-run-stream]').click();
  uploadStreamInputFile();
  cy.wait('@uploadStreamInput').then(() => {
    cy.get('[data-cy=stream-input-upload-status]').within(() => {
      cy.get('[data-cy=uploaded]').should('exist');
    });
  });
  cy.get('[data-cy=stream-simulation-run-stream]').click();
  // wait for simulation to start
  cy.wait(3000);
}

function uploadStreamInputFile() {
  // file path w.r.t fixturesFolder
  const filePath = 'stream-input.csv';
  cy.get('[data-cy=upload-stream-data-input]').attachFile(filePath, {
    force: true,
  });
}
