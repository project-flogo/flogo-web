import { CompilerOptions } from 'typescript';
import {
  chain,
  externalSchematic,
  Rule,
  Tree,
  SchematicContext,
  apply,
  url,
  template,
  move,
  branchAndMerge,
  mergeWith,
  MergeStrategy,
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { getWorkspace, formatFiles } from '@nrwl/workspace';

const LIBS_PROJECT = 'lib-client';
const ROOT_TS_CONFIG = 'tsconfig.json';

export default function(schema: any): Rule {
  return async (tree, context) => {
    const workspace = await getWorkspace(tree);
    const projectRoot = workspace.projects.get(LIBS_PROJECT).root;
    return chain([
      externalSchematic('@schematics/angular', 'module', {
        name: schema.name,
        project: LIBS_PROJECT,
      }),
      normalizeModuleStructure(projectRoot, schema.name),
      addTemplateFiles(projectRoot, schema.name),
      registerTsModule(projectRoot, schema.name),
      formatFiles(),
    ]);
  };
}

function normalizeModuleStructure(projecRoot: string, name: string) {
  const dasherizedName = strings.dasherize(name);
  return move(
    `${projecRoot}/lib/${dasherizedName}`,
    `${projecRoot}/${dasherizedName}/src`
  );
}

function addTemplateFiles(projecRoot: string, libName: string) {
  const dasherizedName = strings.dasherize(libName);
  return (tree: Tree, _context: SchematicContext) => {
    const templateSource = apply(url('./files'), [
      template({
        ...strings,
        name: libName,
      }),
      move(`${projecRoot}/${dasherizedName}`),
    ]);
    return chain([
      branchAndMerge(
        chain([mergeWith(templateSource, MergeStrategy.Overwrite)]),
        MergeStrategy.Overwrite
      ),
    ])(tree, _context);
  };
}

function registerTsModule(projectRoot, libName) {
  return (tree: Tree) => {
    const rootTsConfigSrc = tree.read(ROOT_TS_CONFIG);
    const tsConfig: { compilerOptions: CompilerOptions } = JSON.parse(
      rootTsConfigSrc.toString('utf-8')
    );
    const dasherizedName = strings.dasherize(libName);
    insertModule(tsConfig, {
      name: `@flogo-web/lib-client/${dasherizedName}`,
      path: `${projectRoot}/${dasherizedName}/src/index.ts`,
    });
    JSON.stringify(tsConfig);
    tree.overwrite(ROOT_TS_CONFIG, JSON.stringify(tsConfig));
    return tree;
  };
}

function insertModule(
  tsConfig: { compilerOptions: CompilerOptions },
  module: { name: string; path: string }
) {
  const paths = tsConfig.compilerOptions.paths;
  const pathPairs = Object.entries(paths);
  let lastIndex = pathPairs.length;
  pathPairs.forEach(([key], index) => {
    if (key.startsWith('@flogo-web/lib-client')) {
      lastIndex = index;
    }
  });
  pathPairs.splice(lastIndex + 1, 0, [module.name, [module.path]]);
  tsConfig.compilerOptions.paths = pathPairs.reduce((all, [key, value]) => {
    all[key] = value;
    return all;
  }, {});
}
