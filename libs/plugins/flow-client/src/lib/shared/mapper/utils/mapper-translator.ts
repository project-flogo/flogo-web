import { isString, isObject, isArray, fromPairs } from 'lodash';
import { resolveExpressionType } from '@flogo-web/parser';
import { EXPR_PREFIX, ValueType } from '@flogo-web/core';
import { Dictionary } from '@flogo-web/lib-client/core';

import { ROOT_TYPES } from '../constants';
import {
  Task,
  FLOGO_ERROR_ROOT_NAME,
  FLOGO_TASK_TYPE,
  MAPPING_TYPE,
} from '../../../core';
// todo: shared models should be moved to core
import {
  FlowMetadata,
  MapperSchema,
  Properties as MapperSchemaProperties,
} from '../../../task-configurator/models';
import { Mappings, MapExpression } from '../models';

export type MappingsValidatorFn = (mappings: Mappings) => boolean;
export interface AttributeDescriptor {
  name: string;
  type: ValueType;
  required?: boolean;
  allowed?: any[];
}

const stringify = v => JSON.stringify(v, null, 2);

function getEnumDescriptor(attr: AttributeDescriptor) {
  let allowed = isArray(attr.allowed) ? [...attr.allowed] : [];
  if (attr.type === ValueType.Boolean) {
    allowed = [true, false, ...allowed];
  }
  if (allowed.length <= 0) {
    return null;
  }
  // removing duplicates
  return Array.from(new Set(allowed).values());
}

export class MapperTranslator {
  static createInputSchema(tile: Task) {
    let attributes = [];
    if (tile.attributes && tile.attributes.inputs) {
      attributes = tile.attributes.inputs;
    }
    return MapperTranslator.attributesToObjectDescriptor(attributes);
  }

  static createOutputSchema(
    tiles: Array<Task | FlowMetadata>,
    additionalSchemas?: MapperSchemaProperties,
    includeEmptySchemas = false
  ): MapperSchema {
    const rootSchema = { type: 'object', properties: {} };
    tiles.forEach(tile => {
      switch (tile.type) {
        case FLOGO_TASK_TYPE.TASK:
        case FLOGO_TASK_TYPE.TASK_SUB_PROC:
        case FLOGO_TASK_TYPE.TASK_ROOT:
          MapperTranslator.addTileToOutputContext(rootSchema, tile, includeEmptySchemas);
          break;
        case 'metadata':
          MapperTranslator.addFlowMetadataToOutputSchema(rootSchema, tile);
          break;
        default:
          rootSchema.properties[tile.name] = { type: tile.type };
          break;
      }
    });
    rootSchema.properties = Object.assign(rootSchema.properties, additionalSchemas);
    rootSchema.properties = sortObjectKeys(rootSchema.properties);
    return rootSchema;
  }

  private static addFlowMetadataToOutputSchema(rootSchema, flowMetadata: FlowMetadata) {
    const flowInputs = flowMetadata.input;
    if (flowInputs && flowInputs.length > 0) {
      const flowInputsSchema = MapperTranslator.attributesToObjectDescriptor(flowInputs);
      flowInputsSchema.rootType = 'flow';
      flowInputsSchema.title = 'flow';
      rootSchema.properties['flow'] = flowInputsSchema;
    }
  }

  static attributesToObjectDescriptor(
    attributes: AttributeDescriptor[],
    additionalProps?: { [key: string]: any }
  ): MapperSchema {
    const properties = {};
    const requiredPropertyNames = [];
    attributes.forEach(attr => {
      let property = {
        type: attr.type,
        // using enum to conform to jsonschema
        enum: getEnumDescriptor(attr),
      };
      if (additionalProps) {
        property = { ...additionalProps, ...property };
      }
      properties[attr.name] = property;
      if (attr.required) {
        requiredPropertyNames.push(attr.name);
      }
    });
    return {
      type: 'object',
      properties: sortObjectKeys(properties),
      required: requiredPropertyNames,
    };
  }

  static translateMappingsIn(inputMappings: any) {
    inputMappings = inputMappings || {};
    return Object.keys(inputMappings).reduce((mappings, input) => {
      const { value, mappingType } = MapperTranslator.processInputValue(
        inputMappings[input]
      );
      mappings[input] = { expression: value, mappingType };
      return mappings;
    }, {});
  }

  static rawExpressionToString(
    rawExpression: any,
    inputType: number = MAPPING_TYPE.LITERAL_ASSIGNMENT
  ) {
    if (isString(rawExpression) && rawExpression.startsWith('=')) {
      return rawExpression.substr(1);
    }
    if (isObject(rawExpression)) {
      let value: object & { mapping?: any } = rawExpression;
      if (value.mapping) {
        value = value.mapping;
      }
      return stringify(value);
    } else if (
      !isString(rawExpression) ||
      inputType === MAPPING_TYPE.LITERAL_ASSIGNMENT
    ) {
      return stringify(rawExpression);
    } else {
      return rawExpression;
    }
  }

  static translateMappingsOut(mappings: {
    [attr: string]: { expression: string; mappingType?: number };
  }): Dictionary<any> {
    return (
      Object.keys(mappings || {})
        // filterOutEmptyExpressions
        .filter(
          attrName =>
            mappings[attrName].expression && mappings[attrName].expression.trim()
        )
        .reduce((inputs, attrName) => {
          const mapping = mappings[attrName];
          const { value } = MapperTranslator.parseExpression(mapping.expression);
          inputs[attrName] = value;
          return inputs;
        }, {})
    );
  }

  static parseExpression(expression: string) {
    const mappingType = mappingTypeFromExpression(expression);
    let value: any = expression;
    if (mappingType === MAPPING_TYPE.LITERAL_ASSIGNMENT) {
      if (expression.startsWith("'") || expression.startsWith('`')) {
        value = JSON.stringify(expression.slice(1, -1));
      }
      value = value !== 'nil' ? JSON.parse(value) : null;
    } else if (mappingType === MAPPING_TYPE.OBJECT_TEMPLATE) {
      value = { mapping: JSON.parse(value) };
    } else {
      value = EXPR_PREFIX + value;
    }
    return { mappingType, value };
  }

  static getRootType(tile: Task | FlowMetadata) {
    if (tile.type === FLOGO_TASK_TYPE.TASK_ROOT) {
      return tile.triggerType === FLOGO_ERROR_ROOT_NAME
        ? ROOT_TYPES.ERROR
        : ROOT_TYPES.TRIGGER;
    } else if (tile.type === 'metadata') {
      return ROOT_TYPES.FLOW;
    }
    return ROOT_TYPES.ACTIVITY;
  }

  static makeValidator(): MappingsValidatorFn {
    return (mappings: Mappings) => {
      if (!mappings) {
        return true;
      }
      const invalidMapping = Object.keys(mappings).find(mapTo =>
        isInvalidMapping(mappings[mapTo])
      );
      return !invalidMapping;
    };
  }

  static isValidExpression(expression: any) {
    return isValidExpression(MapperTranslator.rawExpressionToString(expression));
  }

  private static processInputValue(inputValue: any) {
    const value = MapperTranslator.rawExpressionToString(inputValue);
    return { value, mappingType: mappingTypeFromExpression(value) };
  }

  private static addTileToOutputContext(
    rootSchema,
    tile,
    includeEmptySchemas: boolean = false
  ) {
    const attributes = tile.attributes;
    let outputs;
    if (
      tile.type === FLOGO_TASK_TYPE.TASK ||
      tile.type === FLOGO_TASK_TYPE.TASK_SUB_PROC
    ) {
      // try to get data from task from outputs
      outputs = attributes && attributes.outputs ? attributes.outputs : [];
    } else {
      // it's a trigger, outputs for trigger doesn't seem to be consistent in the UI model impl
      // hence checking in two places
      outputs = (<any>tile).outputs || (attributes && attributes.outputs);
    }
    const hasAttributes = outputs && outputs.length > 0;
    if (hasAttributes || includeEmptySchemas) {
      const tileSchema = MapperTranslator.attributesToObjectDescriptor(outputs || []);
      tileSchema.rootType = MapperTranslator.getRootType(tile);
      tileSchema.title = tile.name;
      const propName = tileSchema.rootType === ROOT_TYPES.ERROR ? 'error' : tile.id;
      rootSchema.properties[propName] = tileSchema;
    }
  }
}

function sortObjectKeys(object: { [key: string]: any }) {
  const keys = Object.keys(object);
  const sortedKeys = keys.sort();
  return fromPairs(sortedKeys.map(key => [key, object[key]]));
}

// TODO: only works for first level mappings
function isInvalidMapping(mapping: MapExpression) {
  const expression = mapping.expression;
  if (!expression || !expression.trim().length) {
    return false;
  }
  return !isValidExpression(expression);
}

function isValidExpression(expression: string) {
  if (!expression || !expression.trim().length) {
    return true;
  }
  const mappingType = resolveExpressionType(expression);
  return mappingType != null;
}

function mappingTypeFromExpression(expression: string) {
  const expressionType = resolveExpressionType(expression);
  let mappingType = null;
  switch (expressionType) {
    case 'json':
      mappingType = MAPPING_TYPE.OBJECT_TEMPLATE;
      break;
    case 'literal':
      mappingType = MAPPING_TYPE.LITERAL_ASSIGNMENT;
      break;
    case 'attrAccess':
      mappingType = MAPPING_TYPE.ATTR_ASSIGNMENT;
      break;
    default:
      mappingType = MAPPING_TYPE.EXPRESSION_ASSIGNMENT;
      break;
  }
  return mappingType;
}
