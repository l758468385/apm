import { BaseObserver } from './BaseObserver';

export class ErrorObserver extends BaseObserver {
  public observe(): void {
    // 处理 JS 运行时错误
    window.addEventListener('error', (event) => {
      if (!event.target || !(event.target instanceof HTMLElement)) {
        this.reporter.push({
          type: 'js_error',
          payload: {
            error: {
              name: event.error?.name || 'Error',
              message: event.message,
              stack: event.error?.stack || ''
            },
            source: {
              type: 'onerror'
            }
          },
          sample_rate: this.config.sampleRate.jsError,
          ts: Date.now()
        });
      }
    }, true);

    // 处理 Promise 未捕获的错误
    window.addEventListener('unhandledrejection', (event) => {
      this.reporter.push({
        type: 'js_error',
        payload: {
          error: {
            name: event.reason?.name || 'UnhandledRejection',
            message: event.reason?.message || String(event.reason),
            stack: event.reason?.stack || ''
          },
          source: {
            type: 'onunhandledrejection'
          }
        },
        sample_rate: this.config.sampleRate.jsError,
        ts: Date.now()
      });
    });
  }
} 