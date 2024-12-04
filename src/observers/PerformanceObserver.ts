import { BaseObserver } from './BaseObserver';
import { Event } from '../types/event';

export class PerformanceObserver extends BaseObserver {
  private observer: any;
  private timingObserver: any;

  public observe(): void {
    // 监控性能指标
    if (window.PerformanceObserver) {
      // FP, FCP 等基础指标
      this.observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const event: Event = {
            type: 'performance',
            payload: {
              name: entry.name,
              value: entry.startTime,
              entryType: entry.entryType
            },
            sample_rate: 1,
            ts: Date.now()
          };
          this.reporter.push(event);
        });
      });

      // Navigation Timing API
      this.timingObserver = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const event: Event = {
            type: 'performance_timing',
            payload: {
              timing: entry.toJSON(),
              isBounced: false
            },
            sample_rate: 1,
            ts: Date.now()
          };
          this.reporter.push(event);
        });
      });

      // 观察不同类型的性能指标
      this.observer.observe({ 
        entryTypes: [
          'paint',               // FP, FCP
          'largest-contentful-paint',  // LCP
          'first-input',         // FID
          'layout-shift'         // CLS
        ] 
      });

      // 观察导航计时
      this.timingObserver.observe({ entryTypes: ['navigation'] });

      // 发送初始性能数据
      this.sendInitialMetrics();
    }
  }

  private sendInitialMetrics() {
    // 发送 performance.timing 数据
    const timing = performance.timing;
    const event: Event = {
      type: 'performance_timing',
      payload: {
        timing: {
          navigationStart: timing.navigationStart,
          unloadEventStart: timing.unloadEventStart,
          unloadEventEnd: timing.unloadEventEnd,
          redirectStart: timing.redirectStart,
          redirectEnd: timing.redirectEnd,
          fetchStart: timing.fetchStart,
          domainLookupStart: timing.domainLookupStart,
          domainLookupEnd: timing.domainLookupEnd,
          connectStart: timing.connectStart,
          connectEnd: timing.connectEnd,
          secureConnectionStart: timing.secureConnectionStart,
          requestStart: timing.requestStart,
          responseStart: timing.responseStart,
          responseEnd: timing.responseEnd,
          domLoading: timing.domLoading,
          domInteractive: timing.domInteractive,
          domContentLoadedEventStart: timing.domContentLoadedEventStart,
          domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
          domComplete: timing.domComplete,
          loadEventStart: timing.loadEventStart,
          loadEventEnd: timing.loadEventEnd
        },
        isBounced: false
      },
      sample_rate: 1,
      ts: Date.now()
    };
    this.reporter.push(event);
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.timingObserver) {
      this.timingObserver.disconnect();
    }
  }
} 