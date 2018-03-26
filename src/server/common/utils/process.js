import { spawn } from 'cross-spawn';
import { logger } from '../logging';

/**
 * Port `child_process.spawn` with Promise, same inputs as the original API
 *
 * https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
 */
export function runShellCMD(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const _cmd = spawn(cmd, args, opts);
    let _data = '';
    let errData = '';

    logger.info(`run command: ${cmd} ${args.join(' ')}`);

    _cmd.stdout.on('data', (data) => {
      _data += data;
    });

    _cmd.stderr.on('data', (data) => {
      errData += data instanceof Buffer ? data.toString() : data;
    });

    _cmd.on('close', (code) => {
      if (code !== 0) {
        logger.warn(`command exited with code ${code}: ${cmd} ${args.join(' ')}`);
        reject(errData);
      } else {
        resolve(_data);
      }
    });
  });
}

export function getHostExecutableExtension() {
  let ext = '';
  if (processHost.isWindows()) {
    ext = '.exe';
  }
  return ext;
}

export const processHost = {
  isWindows() {
    return process.platform === 'win32';
  },
};
