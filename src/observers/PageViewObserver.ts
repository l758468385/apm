import { BaseObserver } from './BaseObserver';

export class PageViewObserver extends BaseObserver {
  private lastPath: string = '';

  public observe(): void {
    // 初始PV
    this.reportPageView();

    // SPA路由变化时的PV
    if (this.config.enableSPA) {
      if (this.config.routeMode === 'hash') {
        window.addEventListener('hashchange', () => this.handleRouteChange());
      } else {
        window.addEventListener('popstate', () => this.handleRouteChange());
      }
    }
  }

  private handleRouteChange() {
    const currentPath = window.location.pathname + window.location.hash;
    if (currentPath !== this.lastPath) {
      this.lastPath = currentPath;
      this.reportPageView();
    }
  }

  private reportPageView() {
    this.reporter.push({
      type: 'pv',
      payload: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now()
      },
      sample_rate: this.config.sampleRate.pv,
      ts: Date.now()
    });
  }
} 