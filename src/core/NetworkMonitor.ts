import { Config } from '../types/config';
import { BatchReporter } from '../reporters/BatchReporter';
import { 
  PerformanceObserver,
  ResourceObserver,
  ErrorObserver,
  HttpObserver,
  BlankScreenObserver
} from '../observers';

export class NetworkMonitor {
  private config: Config;
  private reporter: BatchReporter;
  private observers: any[] = [];
  private _started: boolean = false;

  constructor(config: Config) {
    this.config = config;
    this.reporter = new BatchReporter(config);
    this.initObservers();
  }

  private initObservers() {
    this.observers = [
      new PerformanceObserver(this.reporter),
      new ResourceObserver(this.reporter),
      new ErrorObserver(this.reporter),
      new HttpObserver(this.reporter),
      new BlankScreenObserver(this.reporter)
    ];
  }

  public start() {
    if (this._started) return;
    this._started = true;

    this.reporter.setupUnloadHandler();

    this.observers.forEach(observer => {
      try {
        observer.observe();
      } catch (error) {
        if (this.config.debug) {
          console.error('[NetworkMonitor] Failed to initialize observer:', error);
        }
      }
    });
  }

  public stop() {
    this.observers.forEach(observer => observer.disconnect());
  }
} 