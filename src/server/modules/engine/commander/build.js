import { config } from '../../../config/app-config';
import {runShellCMD, copyFile, changePermissions, findMostRecentFile} from '../../../common/utils';
var path = require('path');

/**
 * Build the engine.
 *
 * For valid compile os and architecture values see https://golang.org/doc/install/source#environment
 *
 * @param enginePath {string} Path to the engine dir
 * @param opts Options for engine build
 * @param opts.target where to place the generated build. Due to current limitations it will be copied to specified destination.
 * @param opts.configDir directory that contains the configuration to incorporate into the executable
 * @param opts.optimize {boolean} Optimize for embedded flows. Default false.
 * @param opts.embedConfig {boolean} Embed application config into executable. Default false.
 * @param opts.compile.os {string} Target operating system. Default value false. Falsy value will fallback to engine host's default os.
 * @param opts.compile.arch {string} Target compilation architechture. Default value false. Falsy value will fallback to engine host's default arch.
 * @param opts.copyFlogoDescriptor {boolean} If should also make a copy of the generated flogo.json
 *
 * @returns {Promise<{path: string}>} path to generated binary
 */
export function build(enginePath, opts) {
  const defaultEnginePath = path.join(enginePath);

  opts = _mergeOpts(opts);

  const args = _getCommandArgs(opts);
  const env = _getEnv(opts);

  console.log(`[log] Build flogo: "flogo build ${args}" compileOpts:`);

  const copyFlogoDescriptor = opts.copyFlogoDescriptor;
  delete opts.copyFlogoDescriptor;

  return runShellCMD(config.cli, ['build'].concat(args), {
    cwd: defaultEnginePath,
    env: Object.assign({}, process.env, env),
  })
    .then(out => console.log(`[log] build output: ${out}`))
    .then(() => _getGeneratedBinaryPath(enginePath, opts.compile))
    .then(binaryPath => {
      if (copyFlogoDescriptor) {
        return copyFile(path.join(enginePath, 'bin', 'flogo.json'), path.join(opts.target, 'flogo.json'))
          .then(() => binaryPath);
      }
      return binaryPath;
    })
    .then(binaryPath => {
      if (opts.target) {
        return _copyBinaryToTarget(binaryPath, opts.target);
      }
      return { path: binaryPath };
    });

}

//////////////////////////
// Helpers
//////////////////////////

function _mergeOpts(opts) {
  let defaultOpts = {
    target: undefined,
    optimize: false, embedConfig: false,
    configDir: undefined,
    compile: {os: false, arch: false}
  };
  return Object.assign({}, defaultOpts, opts);
}

function _getCommandArgs(opts) {
  let args = [
    opts.optimize ? '-o' : '',
    opts.embedConfig ? '-e' : '',
  ];

  if(opts.embedConfig && opts.configDir) {
    args.push('-c', opts.configDir)
  }

  // clean args
  args = args.join(' ').trim().split(' ');

  return args;
}

function _getEnv(opts) {
  let env = {};

  if (opts.compile) {
    if (opts.compile.os) {
      env['GOOS'] = opts.compile.os;
    }

    if (opts.compile.arch) {
      env['GOARCH'] = opts.compile.arch
    }
  }

  return env;
}

function _copyBinaryToTarget(binaryPath, targetDir) {
  const enginePathInfo = path.parse(binaryPath);
  const from = binaryPath;
  const to = path.join(targetDir, enginePathInfo.name);

  const execPermissions = 0o755;
  return copyFile(from, to)
    .then(() => changePermissions(to, execPermissions))
    .then(() => ({path: to}));

}

function _getGeneratedBinaryPath(enginePath, compileOptions) {
  let enginePathInfo = path.parse(enginePath);
  let binDirPath = path.join(enginePath, 'bin');
  let executableFilePattern = _determineBuildExecutableNamePattern(enginePathInfo.name, compileOptions );
  console.log( `[log] execName: ${executableFilePattern.namePattern}` );

  // if no compile options provided or both options provided we can skip the search for generated binary since we have the exact name
  if ( executableFilePattern.isDefaultCompile ) {
    console.log( '[debug] Default compile, grab file directly' );
    return Promise.resolve(path.resolve(binDirPath, executableFilePattern.namePattern));
  } else {
    console.log( '[debug] Find file' );
    return findMostRecentFile(binDirPath, new RegExp( executableFilePattern.namePattern ))
      .then( binaryPath => {
        console.log( '[log] Found: ' + JSON.stringify( binaryPath ) );
        return binaryPath ;
      } );
  }
}

function _determineBuildExecutableNamePattern(name, compileOptions) {
  let namePattern = name;
  let isDefaultCompile = !(compileOptions.os || compileOptions.arch);

  if(compileOptions.os && compileOptions.arch) {
    namePattern = `${namePattern}-${compileOptions.os}-${compileOptions.arch}`;
  } else if (compileOptions.os) {
    namePattern = `${namePattern}-${compileOptions.os}`;
  } else if (compileOptions.arch) {
    namePattern = `${namePattern}-.*-${compileOptions.arch}`;
  }
  return {
    isDefaultCompile,
    namePattern
  };
}
