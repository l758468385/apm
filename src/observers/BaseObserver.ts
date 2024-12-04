import { BatchReporter } from '../reporters/BatchReporter';

export abstract class BaseObserver {
  protected reporter: BatchReporter;

  constructor(reporter: BatchReporter) {
    this.reporter = reporter;
  }

  abstract observe(): void;
  abstract disconnect(): void;
} 