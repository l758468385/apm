import { BaseObserver } from './BaseObserver';
import { Event } from '../types/event';

export class ResourceObserver extends BaseObserver {
  private observer: any;

  public observe(): void {
    console.log('ResourceObserver observe ');
    // 监听资源加载失败
    window.addEventListener('error', (event) => {
      console.log('event',event)
      if (event.target instanceof HTMLElement) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
          const event: Event = {
            type: 'resource_error',
            payload: {
              type: target.tagName.toLowerCase(),
              url: (target as any).src || (target as any).href,
              status_code: 0,
              timing: {
                startTime: Date.now(),
                duration: 0
              }
            },
            ts: Date.now()
          };
          this.reporter.push(event);
        }
      }
    }, true);

    // 监听资源加载
    if (window.PerformanceObserver) {
      this.observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const resourceEntry = entry as PerformanceResourceTiming;
          const event: Event = {
            type: 'resource',
            payload: {
              type: resourceEntry.initiatorType,
              url: resourceEntry.name,
              status_code: 200,
              timing: resourceEntry.toJSON()
            },
            ts: Date.now()
          };
          this.reporter.push(event);
        });
      });

      this.observer.observe({ entryTypes: ['resource'] });
    }
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
} 