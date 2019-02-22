import { join as joinPath } from 'path';
import { runShellCMD } from '../../../common/utils/process';
import { logger } from '../../../common/logging';

import { mergeEnvWithOpts } from './merge-env-with-opts';

/**
 * Build the engine.
 *
 * For valid compile os and architecture values see https://golang.org/doc/install/source#environment
 *
 * @param enginePath {string} Path to the engine dir
 * @param opts Options for engine build
 * @param opts.target where to place the generated build. Due to current limitations it will be copied to
 *  specified destination.
 * @param opts.configDir directory that contains the configuration to incorporate into the executable
 * @param opts.optimize {boolean} Optimize for embedded flows. Default false.
 * @param opts.embedConfig {boolean} Embed application config into executable. Default false.
 * @param opts.shimTriggerId {string} Build the app as shim, pass trigger id as value
 * @param opts.compile.os {string} Target operating system. Default value false. Falsy value will fallback to
 *  engine host's default os.
 * @param opts.compile.arch {string} Target compilation architechture. Default value false.
 *  Falsy value will fallback to engine host's default arch.
 * @param opts.copyFlogoDescriptor {boolean} If should also make a copy of the generated flogo.json
 *
 * @returns {Promise<{path: string}>} path to generated binary
 */
export function build(enginePath, opts) {
  const defaultEnginePath = joinPath(enginePath);

  opts = _mergeOpts(opts);

  const args = _translateOptsToCommandArgs(opts);
  const env = mergeEnvWithOpts(opts, process.env);

  logger.info(`[log] Build flogo: "flogo build ${args}" compileOpts:`);

  return runShellCMD('flogo', ['build'].concat(args), {
    cwd: defaultEnginePath,
    env,
  });
}

// ////////////////////////
// Helpers
// ////////////////////////

function _mergeOpts(opts) {
  return {
    target: undefined,
    optimize: false,
    embedConfig: false,
    configDir: undefined,
    compile: { os: false, arch: false },
    ...opts,
  };
}

function _translateOptsToCommandArgs(opts) {
  const args = [] as string[];
  if (opts.optimize) {
    args.push('-o');
  }

  if (opts.embedConfig) {
    args.push('-e');
  }

  if (opts.embedConfig && opts.configDir) {
    args.push('-c', opts.configDir);
  }

  if (opts.shimTriggerId) {
    args.push('--shim', opts.shimTriggerId);
  }

  return args;
}
