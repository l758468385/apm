import { BaseObserver } from './BaseObserver';

export class HttpObserver extends BaseObserver {
  public observe(): void {
    this.interceptXHR();
    this.interceptFetch();
  }

  private interceptXHR(): void {
    const originalXHR = window.XMLHttpRequest;
    const self = this;

    interface ExtendedXMLHttpRequest extends XMLHttpRequest {
      _method?: string;
      _requestHeaders?: Record<string, string>;
      _url?: string;
    }

    window.XMLHttpRequest = function() {
      const xhr = new originalXHR() as ExtendedXMLHttpRequest;
      const startTime = Date.now();
      
      const originalOpen = xhr.open;
      xhr.open = function(method: string, url: string | URL, async?: boolean, username?: string, password?: string) {
        xhr._method = method;
        xhr._url = url.toString();
        return originalOpen.call(this, method, url, async ?? true, username, password);
      };

      const originalSetRequestHeader = xhr.setRequestHeader;
      xhr._requestHeaders = {};
      xhr.setRequestHeader = function(name: string, value: string) {
        xhr._requestHeaders![name.toLowerCase()] = value;
        return originalSetRequestHeader.call(this, name, value);
      };

      xhr.addEventListener('loadend', function() {
        const responseHeaders: Record<string, string> = {};
        xhr.getAllResponseHeaders().split('\r\n').forEach(line => {
          const [name, value] = line.split(': ');
          if (name) {
            responseHeaders[name.toLowerCase()] = value;
          }
        });

        const timing = performance.getEntriesByName(xhr._url || '', 'resource')[0] as PerformanceResourceTiming;

        self.reporter.push({
          type: 'http',
          payload: {
            type: 'xhr',
            url: xhr._url,
            status_code: xhr.status,
            request: {
              method: xhr._method?.toLowerCase() || 'get',
              timestamp: startTime,
              url: xhr._url,
              headers: xhr._requestHeaders
            },
            response: {
              status: xhr.status,
              timestamp: Date.now(),
              headers: responseHeaders
            },
            timing: timing ? timing.toJSON() : {
              startTime: startTime,
              duration: Date.now() - startTime
            }
          },
          sample_rate: self.config.sampleRate.http,
          ts: Date.now()
        });
      });

      return xhr;
    } as any;
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(input: URL | RequestInfo, init?: RequestInit) {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      try {
        const response = await originalFetch(input, init);
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, name) => {
          responseHeaders[name.toLowerCase()] = value;
        });

        const timing = performance.getEntriesByName(url, 'resource')[0] as PerformanceResourceTiming;

        self.reporter.push({
          type: 'http',
          payload: {
            type: 'fetch',
            url: url,
            status_code: response.status,
            method: (init?.method || 'get').toLowerCase(),
            request: {
              method: (init?.method || 'get').toLowerCase(),
              timestamp: startTime,
              url: url,
              headers: init?.headers ? Object.fromEntries(
                Object.entries(init.headers).map(([k, v]) => [k.toLowerCase(), v])
              ) : {}
            },
            response: {
              status: response.status,
              timestamp: Date.now(),
              headers: responseHeaders
            },
            timing: timing ? timing.toJSON() : {
              startTime: startTime,
              duration: Date.now() - startTime
            }
          },
          sample_rate: self.config.sampleRate.http,
          ts: Date.now()
        });

        return response;
      } catch (error) {
        // 请求失败时也需要上报
        self.reporter.push({
          type: 'http',
          payload: {
            type: 'fetch',
            url: url,
            status_code: 0,
            method: (init?.method || 'get').toLowerCase(),
            request: {
              method: (init?.method || 'get').toLowerCase(),
              timestamp: startTime,
              url: url,
              headers: init?.headers ? Object.fromEntries(
                Object.entries(init.headers).map(([k, v]) => [k.toLowerCase(), v])
              ) : {}
            },
            error: error instanceof Error ? error.message : String(error)
          },
          sample_rate: self.config.sampleRate.http,
          ts: Date.now()
        });
        throw error;
      }
    } as typeof window.fetch;
  }
} 