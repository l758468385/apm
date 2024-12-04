import { BaseObserver } from './BaseObserver';
import { Event } from '../types/event';

export class ErrorObserver extends BaseObserver {
  private errorHandler!: (event: ErrorEvent) => void;
  private rejectionHandler!: (event: PromiseRejectionEvent) => void;

  public observe(): void {
    this.errorHandler = (event: ErrorEvent) => {
      const errorEvent: Event = {
        type: 'js_error',
        payload: {
          error: {
            name: event.error?.name || 'Error',
            message: event.message,
            stack: event.error?.stack
          },
          source: {
            type: 'onerror'
          }
        },
        sample_rate: 1,
        ts: Date.now()
      };
      this.reporter.push(errorEvent);
    };

    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      const errorEvent: Event = {
        type: 'js_error',
        payload: {
          error: {
            name: event.reason?.name || 'UnhandledRejection',
            message: event.reason?.message || String(event.reason),
            stack: event.reason?.stack
          },
          source: {
            type: 'onunhandledrejection'
          }
        },
        sample_rate: 1,
        ts: Date.now()
      };
      this.reporter.push(errorEvent);
    };

    window.addEventListener('error', this.errorHandler);
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }

  public disconnect(): void {
    window.removeEventListener('error', this.errorHandler);
    window.removeEventListener('unhandledrejection', this.rejectionHandler);
  }
} 