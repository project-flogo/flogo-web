import { isEmpty } from 'lodash';
import { createFeatureSelector, createSelector } from '@ngrx/store';

import { DiagramSelectionType } from '@flogo-web/lib-client/diagram';
import { Dictionary, DiagramGraph } from '@flogo-web/lib-client/core';
import {
  ContributionType,
  FunctionsSchema,
  ContributionSchema,
  CONTRIB_REFS,
} from '@flogo-web/core';

import { FlogoStreamState } from './stream.state';
import { InstalledFunctionSchema } from '../interfaces';
import { CurrentSelection, SelectionType, TaskSelection } from '../models';
import { Activity } from '../../stage-add';
import { GRAPH_NAME } from '../constants';
import { graphToTiles } from './graph-to-tiles';
import { ROOT_PIPELINE_ID } from '../../simulator';

export const selectStreamState = createFeatureSelector<FlogoStreamState>('stream');

export const selectSimulatorPanelOpen = createSelector(
  selectStreamState,
  (state: FlogoStreamState) => state.isSimulatorPanelOpen
);

export const selectTriggers = createSelector(
  selectStreamState,
  (streamState: FlogoStreamState) => streamState.triggers
);

export const selectHandlers = createSelector(
  selectStreamState,
  (streamState: FlogoStreamState) => streamState.handlers
);

export const selectApp = createSelector(
  selectStreamState,
  (streamState: FlogoStreamState) => streamState.app
);

export const selectActionId = createSelector(
  selectStreamState,
  (streamState: FlogoStreamState) => streamState.id
);

export const selectTriggerConfigure = createSelector(
  selectStreamState,
  (streamState: FlogoStreamState) => streamState.triggerConfigure
);

export const selectAppInfo = createSelector(
  selectApp,
  app => {
    if (!app) {
      return {
        appId: null,
      };
    }
    return {
      appId: app.id,
    };
  }
);

export const selectStreamMetadata = createSelector(
  selectStreamState,
  (streamState: FlogoStreamState) => streamState.metadata
);

export const selectSchemas = createSelector(
  selectStreamState,
  (streamState: FlogoStreamState) => streamState.schemas
);

export const getInstalledFunctions = createSelector(
  selectSchemas,
  (schemas: Dictionary<FunctionsSchema>): InstalledFunctionSchema[] => {
    return Object.values(schemas)
      .filter(schema => schema.type === ContributionType.Function)
      .map(schema => ({
        functions: schema.functions,
        name: schema.name,
        type: schema.type,
        ref: schema.ref,
      }));
  }
);

export const selectGraph = createSelector(
  selectStreamState,
  streamState => streamState[GRAPH_NAME]
);

export const selectItems = createSelector(
  selectStreamState,
  streamState => streamState.mainItems
);

export const selectCurrentSelection = createSelector(
  selectStreamState,
  (state: FlogoStreamState) => state.currentSelection
);

const isTaskSelection = (selection): selection is TaskSelection =>
  selection && selection.type === SelectionType.Task;
export const getSelectedStageInfo = createSelector(
  selectCurrentSelection,
  selectItems,
  selectSchemas,
  (currentSelection, items, schemas) => {
    if (isTaskSelection(currentSelection) && items[currentSelection.taskId]) {
      const stage = items[currentSelection.taskId];
      return {
        ...stage,
        schemaHomepage: schemas[stage.ref],
      };
    }
    return null;
  }
);

export const getDiagramSelection = createSelector(
  selectCurrentSelection,
  (selection: CurrentSelection) => {
    if (selection && selection.type === SelectionType.InsertTask) {
      return {
        type: DiagramSelectionType.Insert,
        taskId: selection.parentId,
      };
    } else if (selection && selection.type === SelectionType.Task) {
      return {
        type: DiagramSelectionType.Node,
        taskId: selection.taskId,
      };
    } else {
      return null;
    }
  }
);

export const getStagesAsTiles = (maxTileCount: number) => {
  return createSelector(
    selectGraph,
    (graph: DiagramGraph) => {
      return graphToTiles(graph, maxTileCount);
    }
  );
};

function findIndexForCurrentSelection(
  graph: DiagramGraph,
  currentSelection: TaskSelection
) {
  let index = 0;
  let currentTask = graph.nodes[graph.rootId];
  while (currentTask && currentTask.id !== currentSelection.taskId) {
    index++;
    const childId = currentTask.children[0];
    if (!childId || !graph.nodes[childId]) {
      return null;
    }
    currentTask = graph.nodes[childId];
  }
  return index;
}

export const getCurrentSimulationStage = createSelector(
  selectCurrentSelection,
  selectGraph,
  (currentSelection: CurrentSelection, graph: DiagramGraph) => {
    if (
      !graph.rootId ||
      !currentSelection ||
      currentSelection.type !== SelectionType.Task
    ) {
      return ROOT_PIPELINE_ID;
    }
    return `${findIndexForCurrentSelection(graph, currentSelection)}`;
  }
);

export const getInstalledActivities = createSelector(
  selectSchemas,
  (schemas: Dictionary<ContributionSchema>): Activity[] =>
    Object.values(schemas)
      .filter(
        schema =>
          schema.type === ContributionType.Activity && schema.ref !== CONTRIB_REFS.SUBFLOW
      )
      .map(schema => ({
        title: schema.title,
        ref: schema.ref,
      }))
      .sort((activity1, activity2) =>
        ('' + activity1.title).localeCompare(activity2.title)
      )
);

export const selectStageConfigure = createSelector(
  selectStreamState,
  (state: FlogoStreamState) => state.stageConfigure
);

export const selectSimulation = createSelector(
  selectStreamState,
  (state: FlogoStreamState) => state.simulation
);

export const getSimulationDetails = createSelector(
  selectActionId,
  selectItems,
  selectSimulation,
  (resourceId, items, simulation) => ({
    resourceId,
    simulation,
    disableRunStream: isEmpty(items),
  })
);
