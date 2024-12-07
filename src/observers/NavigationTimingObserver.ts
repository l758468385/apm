import { BaseObserver } from './BaseObserver';

// 专门处理 Navigation Timing API 相关指标
export class NavigationTimingObserver extends BaseObserver {
  private observer: any;

  public observe(): void {
    if (window.PerformanceObserver) {
      this.observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.reporter.push({
              type: 'performance_timing',
              payload: {
                isBounced: false,
                timing: {
                  name: navEntry.name,
                  entryType: navEntry.entryType,
                  startTime: navEntry.startTime,
                  duration: navEntry.duration,
                  initiatorType: navEntry.initiatorType,
                  nextHopProtocol: navEntry.nextHopProtocol,
                  workerStart: navEntry.workerStart,
                  redirectStart: navEntry.redirectStart,
                  redirectEnd: navEntry.redirectEnd,
                  fetchStart: navEntry.fetchStart,
                  domainLookupStart: navEntry.domainLookupStart,
                  domainLookupEnd: navEntry.domainLookupEnd,
                  connectStart: navEntry.connectStart,
                  connectEnd: navEntry.connectEnd,
                  secureConnectionStart: navEntry.secureConnectionStart,
                  requestStart: navEntry.requestStart,
                  responseStart: navEntry.responseStart,
                  responseEnd: navEntry.responseEnd,
                  transferSize: navEntry.transferSize,
                  encodedBodySize: navEntry.encodedBodySize,
                  decodedBodySize: navEntry.decodedBodySize,
                  serverTiming: navEntry.serverTiming,
                  unloadEventStart: navEntry.unloadEventStart,
                  unloadEventEnd: navEntry.unloadEventEnd,
                  domInteractive: navEntry.domInteractive,
                  domContentLoadedEventStart: navEntry.domContentLoadedEventStart,
                  domContentLoadedEventEnd: navEntry.domContentLoadedEventEnd,
                  domComplete: navEntry.domComplete,
                  loadEventStart: navEntry.loadEventStart,
                  loadEventEnd: navEntry.loadEventEnd,
                  type: navEntry.type,
                  redirectCount: navEntry.redirectCount
                }
              },
              sample_rate: this.config.sampleRate.performance,
              ts: Date.now()
            });
          }
        });
      });

      this.observer.observe({ entryTypes: ['navigation'] });
    }
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
} 