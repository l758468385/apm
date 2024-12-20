import { BatchReporter } from '../reporters/BatchReporter';
import { Config } from '../types/config';

export abstract class BaseObserver {
  protected reporter: BatchReporter;
  protected config: Config;

  constructor(reporter: BatchReporter) {
    this.reporter = reporter;
    this.config = reporter.getConfig();
  }

  abstract observe(): void;
  
  public disconnect(): void {
    // 默认实现，子类可以覆盖
  }
} 