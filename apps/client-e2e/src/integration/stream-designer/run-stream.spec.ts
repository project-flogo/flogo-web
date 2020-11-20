import {
  createAnAction,
  createApp,
  visitApp,
  navigateToActionPage,
  getAddActivityButton,
  addActivity,
  Actions,
  RUN_STREAM,
} from '../../utils';

describe('Run stream', function() {
  beforeEach(() => {
    visitApp();
    createApp();
    createAnAction(Actions.Stream);
    navigateToActionPage();

    cy.server();
    cy.route({
      method: 'POST',
      url: RUN_STREAM,
    }).as('uploadStreamInput');
  });

  context('Upload stream input file, start/stop simulation', () => {
    it('should be able to upload a stream input csv file', () => {
      getAddActivityButton().click();
      cy.get('[data-cy=diagram-add-activity-activity]')
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

    it('should be able to remove the stream input csv file', () => {
      getAddActivityButton().click();
      cy.get('[data-cy=diagram-add-activity-activity]')
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

    it('should be able to start simulation', () => {
      startSimulation();
      // override query element retry timeout to wait until buttons are visible
      cy.get('[data-cy=simulation-ctrls-stop-btn]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy=simulation-ctrls-pause-btn]').should('exist');
    });

    it('should be able to pause simulation', () => {
      startSimulation();
      // wait before pausing the simulation
      cy.wait(3000);
      // override query element retry timeout to wait until buttons are visible
      cy.get('[data-cy=simulation-ctrls-pause-btn]', { timeout: 10000 }).click();
      cy.get('[data-cy=simulation-ctrls-resume-btn]').should('exist');
    });

    it('should be able to resume simulation', () => {
      startSimulation();
      // wait before pausing the simulation
      cy.wait(3000);
      // override query element retry timeout to wait until buttons are visible
      cy.get('[data-cy=simulation-ctrls-pause-btn]', { timeout: 10000 }).click();
      // wait before resuming the simulation
      cy.wait(3000);
      cy.get('[data-cy=simulation-ctrls-resume-btn]').click();
      cy.get('[data-cy=simulation-ctrls-pause-btn]').should('exist');
    });

    it('should be able to stop simulation', () => {
      startSimulation();
      // wait before stopping the simulation
      cy.wait(3000);
      // override query element retry timeout to wait until buttons are visible
      cy.get('[data-cy=simulation-ctrls-stop-btn]', { timeout: 10000 }).click();
      cy.get('[data-cy=simulation-ctrls-open-run-stream]').should('exist');
    });
  });

  context('Auto stop stream simulation', () => {
    it('should auto stop simulation if stream inputs/outputs are changed', () => {
      startSimulation();

      cy.get('[data-cy=stream-params-schema-button]').click({ force: true });
      cy.get('[data-cy=stream-resource-input-row]')
        .eq(0)
        .within(() => {
          cy.get('[data-cy=stream-resource-input]').type('updateInput');
        });
      cy.get('[data-cy=stream-resource-interface-modal-save]').click();

      cy.get('[data-cy=simulation-ctrls-open-run-stream]').should('exist');
    });

    it('should auto stop simulation when diagram is updated', () => {
      startSimulation();
      addActivity('', { force: true });
      cy.get('[data-cy=simulation-ctrls-open-run-stream]').should('exist');
    });
  });
});

/*
 * Add and configure stages,
 * upload stream input data and
 * run stream simulation
 * */
function startSimulation() {
  addActivity('Log');
  addActivity('Filter');

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
    monacoEditorInput(`$pipeline.${INPUT}`);

    // configure stage outputs
    cy.get('[data-cy=outputMappings]').click();
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get(`[data-cy="pipeline.${OUTPUT}"]`).click();
    });
    monacoEditorInput('"some output"');
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
    monacoEditorInput('"non-zero"');
    // configure stage inputs
    cy.get('[data-cy=inputMappings]').click();
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get('[data-cy=value]').click();
    });
    monacoEditorInput(`$pipeline.${INPUT}`);

    // configure stage outputs
    cy.get('[data-cy=outputMappings]').click();
    cy.get('[data-cy=flogo-mapper-list]').within(() => {
      cy.get(`[data-cy="pipeline.${OUTPUT}"]`).click();
    });
    monacoEditorInput('$.value');
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

function monacoEditorInput(input) {
  // wait for monaco editor to load
  cy.wait(2000);
  cy.get('[data-cy=flogo-mapper-editor]')
    .click()
    // change subject to currently focused element
    .focused()
    .type(input);
  // wait for cypress to finish type data into the monaco editor
  cy.wait(1000);
}
