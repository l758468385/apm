import { BaseObserver } from './BaseObserver';
import { Event } from '../types/event';

export class HttpObserver extends BaseObserver {
  private originalFetch!: typeof window.fetch;
  private originalXHR!: typeof window.XMLHttpRequest;

  public observe(): void {
    this.interceptFetch();
    this.interceptXHR();
  }

  private interceptFetch() {
    this.originalFetch = window.fetch;
    const newFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      try {
        const response = await this.originalFetch.call(window, input, init);
        this.reportHttpEvent('fetch', url, response.status, startTime, Date.now(), init?.method || 'GET');
        return response;
      } catch (error) {
        this.reportHttpEvent('fetch', url, 0, startTime, Date.now(), init?.method || 'GET');
        throw error;
      }
    };
    window.fetch = newFetch;
  }

  private interceptXHR() {
    this.originalXHR = window.XMLHttpRequest;
    const self = this;

    interface ExtendedXMLHttpRequest extends XMLHttpRequest {
      _method?: string;
    }

    window.XMLHttpRequest = function(this: ExtendedXMLHttpRequest) {
      const xhr = new self.originalXHR() as ExtendedXMLHttpRequest;
      const startTime = Date.now();

      const originalOpen = xhr.open;
      xhr.open = function(method: string, ...args: any[]) {
        xhr._method = method;
        const [url = '', async = true, username, password] = args;
        const params = [method, url, async, username, password].slice(0, 5) as [
          string,
          string | URL,
          boolean,
          (string | null | undefined)?,
          (string | null | undefined)?
        ];
        return originalOpen.apply(this, params);
      };

      xhr.addEventListener('load', () => {
        self.reportHttpEvent('xhr', xhr.responseURL, xhr.status, startTime, Date.now(), xhr._method || 'GET');
      });

      xhr.addEventListener('error', () => {
        self.reportHttpEvent('xhr', xhr.responseURL, 0, startTime, Date.now(), xhr._method || 'GET');
      });

      return xhr;
    } as any;
  }

  private reportHttpEvent(type: string, url: string, status: number, startTime: number, endTime: number, method: string) {
    const event: Event = {
      type: 'http',
      payload: {
        type,
        url,
        status_code: status,
        method: method.toLowerCase(),
        timing: {
          startTime,
          duration: endTime - startTime
        }
      },
      ts: Date.now()
    };
    this.reporter.push(event);
  }

  public disconnect(): void {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    if (this.originalXHR) {
      window.XMLHttpRequest = this.originalXHR;
    }
  }
} 