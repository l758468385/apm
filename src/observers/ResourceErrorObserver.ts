import { BaseObserver } from './BaseObserver';
import { ResourceTimingData } from '../types/performance';

export class ResourceErrorObserver extends BaseObserver {
  private failedResources: Set<string> = new Set();

  public observe(): void {
    window.addEventListener('error', (event) => {
      if (event.target instanceof HTMLElement) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
          const url = (target as any).src || (target as any).href;
          this.failedResources.add(url);
          
          const resourceTiming = performance.getEntriesByName(url, 'resource')[0] as PerformanceResourceTiming;
          
          const timing: ResourceTimingData = {
            name: url,
            entryType: 'resource',
            startTime: resourceTiming?.startTime || performance.now(),
            duration: resourceTiming?.duration || 0,
            initiatorType: resourceTiming?.initiatorType || target.tagName.toLowerCase(),
            nextHopProtocol: resourceTiming?.nextHopProtocol || '',
            workerStart: resourceTiming?.workerStart || 0,
            redirectStart: resourceTiming?.redirectStart || 0,
            redirectEnd: resourceTiming?.redirectEnd || 0,
            fetchStart: resourceTiming?.fetchStart || performance.now(),
            domainLookupStart: resourceTiming?.domainLookupStart || 0,
            domainLookupEnd: resourceTiming?.domainLookupEnd || 0,
            connectStart: resourceTiming?.connectStart || 0,
            connectEnd: resourceTiming?.connectEnd || 0,
            secureConnectionStart: resourceTiming?.secureConnectionStart || 0,
            requestStart: resourceTiming?.requestStart || performance.now(),
            responseStart: resourceTiming?.responseStart || 0,
            responseEnd: resourceTiming?.responseEnd || 0,
            transferSize: resourceTiming?.transferSize || 0,
            encodedBodySize: resourceTiming?.encodedBodySize || 0,
            decodedBodySize: resourceTiming?.decodedBodySize || 0,
            serverTiming: resourceTiming?.serverTiming || []
          };

          this.reporter.push({
            type: 'resource_error',
            payload: {
              type: target.tagName.toLowerCase(),
              url: url,
              status_code: 0,
              timing
            },
            sample_rate: this.config.sampleRate.resourceError,
            ts: Date.now()
          });
        }
      }
    }, true);
  }
} 