import { Logger } from 'winston';
import { EngineProjectDetails } from '../engine';
import { setupStdioRedirection } from './logging';
import { RunningChildProcess } from './running-child-process';
import { EngineProcessDirector } from './engine-process-director';

export class StreamRunnerProcess {
  public whenStarted: Promise<void>;
  private internalAppJsonPath: string;
  private resolveStarted: () => any;
  private currentProcess: RunningChildProcess;

  constructor(
    private engineProcessDirector: EngineProcessDirector,
    private logger?: Logger
  ) {
    this.whenStarted = new Promise(resolve => {
      this.resolveStarted = resolve;
    });
  }

  start(engineDetails: EngineProjectDetails) {
    return this.engineProcessDirector.acquire({
      engineDetails,
      resolveEnv: () => this.resolveStreamEnv(),
      afterStart: (subprocess: RunningChildProcess) => this.afterStart(subprocess),
    });
  }

  stop(): Promise<any> {
    if (!this.currentProcess) {
      return Promise.resolve(0);
    }
    if (this.engineProcessDirector.isProcessStillRunning(this.currentProcess)) {
      this.engineProcessDirector.kill();
    }
    return this.currentProcess.whenClosed;
  }

  setAppJsonPath(appJsonPath: string) {
    this.internalAppJsonPath = appJsonPath;
  }

  getAppJsonPath() {
    return this.internalAppJsonPath;
  }

  isRunning() {
    return this.currentProcess && !this.currentProcess.closed;
  }

  getCurrentChildProcess() {
    return this.currentProcess;
  }

  afterStart(subprocess: RunningChildProcess) {
    this.currentProcess = subprocess;
    if (process.env['FLOGO_ENGINE_CONSOLE_LOG']) {
      subprocess.stdout.on('data', data =>
        console.log(`[stream-runner]`, data.toString())
      );
      subprocess.stderr.on('data', data =>
        console.error(`[stream-runner]`, data.toString())
      );
    }
    setupStdioRedirection(subprocess, 'stream-engine', {
      logger: this.logger,
    });
    this.resolveStarted();
  }

  private resolveStreamEnv(): { [key: string]: any } {
    return {
      FLOGO_CONFIG_PATH: this.getAppJsonPath(),
    };
  }
}
