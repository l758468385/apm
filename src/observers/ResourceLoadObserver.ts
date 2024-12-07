import { BaseObserver } from './BaseObserver';
import { ResourceTimingData } from '../types/performance';

export class ResourceLoadObserver extends BaseObserver {
  private observer: PerformanceObserver | null = null;

  public observe(): void {
    if (window.PerformanceObserver) {
      this.observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.initiatorType !== 'xmlhttprequest' && 
              resourceEntry.initiatorType !== 'fetch') {
            
            const timing: ResourceTimingData = {
              name: resourceEntry.name,
              entryType: resourceEntry.entryType,
              startTime: resourceEntry.startTime,
              duration: resourceEntry.duration,
              initiatorType: resourceEntry.initiatorType,
              nextHopProtocol: resourceEntry.nextHopProtocol,
              workerStart: resourceEntry.workerStart,
              redirectStart: resourceEntry.redirectStart,
              redirectEnd: resourceEntry.redirectEnd,
              fetchStart: resourceEntry.fetchStart,
              domainLookupStart: resourceEntry.domainLookupStart,
              domainLookupEnd: resourceEntry.domainLookupEnd,
              connectStart: resourceEntry.connectStart,
              connectEnd: resourceEntry.connectEnd,
              secureConnectionStart: resourceEntry.secureConnectionStart,
              requestStart: resourceEntry.requestStart,
              responseStart: resourceEntry.responseStart,
              responseEnd: resourceEntry.responseEnd,
              transferSize: resourceEntry.transferSize,
              encodedBodySize: resourceEntry.encodedBodySize,
              decodedBodySize: resourceEntry.decodedBodySize,
              serverTiming: resourceEntry.serverTiming
            };

            this.reporter.push({
              type: 'resource',
              payload: {
                type: resourceEntry.initiatorType,
                url: resourceEntry.name,
                status_code: 200,
                timing
              },
              sample_rate: this.config.sampleRate.resource,
              ts: Date.now()
            });
          }
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