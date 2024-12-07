import { BaseObserver } from './BaseObserver';
interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
} 
export class WebVitalsObserver extends BaseObserver {
  private metricsReported: Set<string> = new Set();
  private observers: PerformanceObserver[] = [];
  private firstFCP: number = 0;
  private longTasks: PerformanceEntry[] = [];

  public observe(): void {
    try {
      // FP & FCP
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-paint') {
            this.reportMetric('fp', entry.startTime);
          } else if (entry.name === 'first-contentful-paint') {
            this.firstFCP = entry.startTime;
            this.reportMetric('fcp', entry.startTime);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.reportMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShiftEntry[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.reportMetric('cls', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // TTI (通过长任务计算)
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.longTasks = this.longTasks.concat(entries);
        this.calculateTTI();
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

    } catch (error) {
      if (this.config.debug) {
        console.error('[WebVitalsObserver] Error:', error);
      }
    }
  }

  private calculateTTI(): void {
    if (this.firstFCP && this.longTasks.length > 0) {
      const tti = Math.max(
        this.firstFCP,
        this.longTasks[this.longTasks.length - 1].startTime + 5000
      );
      this.reportMetric('tti', tti);
    }
  }

  private reportMetric(name: string, value: number): void {
    if (this.metricsReported.has(name)) return;

    this.reporter.push({
      type: 'performance',
      payload: {
        name,
        value,
        isBounced: document.visibilityState === 'hidden'
      },
      sample_rate: this.config.sampleRate.performance,
      ts: Date.now()
    });
    
    this.metricsReported.add(name);
  }

  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

