import { Config } from "../types/config";
import { BatchReporter } from "../reporters/BatchReporter";
import {
  WebVitalsObserver,
  NavigationTimingObserver,
  ResourceLoadObserver,
  ResourceErrorObserver,
  ErrorObserver,
  HttpObserver,
  BlankScreenObserver,
} from "../observers";
import { BaseObserver } from "../observers/BaseObserver";

export class NetworkMonitor {
  private config: Config;
  private reporter: BatchReporter;
  private observers: BaseObserver[] = [];
  private _started: boolean = false;

  constructor(config: Config) {
    this.config = config;
    this.reporter = new BatchReporter(config);
    this.initObservers();
    
    // 保存实例到全局
    window.__NETWORK_MONITOR_INSTANCE__ = this;
    
    // SPA 路由监听
    if (this.config.enableSPA) {
      this.initRouteListener();
    }
  }

  private initRouteListener() {
    if (this.config.routeMode === 'hash') {
      window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    } else {
      // history 模式
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      
      window.history.pushState = function(...args) {
        originalPushState.apply(this, args);
        window.dispatchEvent(new Event('popstate'));
      };
      
      window.history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        window.dispatchEvent(new Event('popstate'));
      };
      
      window.addEventListener('popstate', this.handleRouteChange.bind(this));
    }
  }

  private handleRouteChange() {
    // 路由变化时重新收集性能数据
    this.observers.forEach(observer => {
      if (observer instanceof WebVitalsObserver) {
        observer.reset();
      }
    });
  }

  public setUserId(userId: string) {
    this.config.userId = userId;
  }

  private initObservers() {
    this.observers = [
      new WebVitalsObserver(this.reporter),
      new NavigationTimingObserver(this.reporter),
      new ResourceLoadObserver(this.reporter),
      new ResourceErrorObserver(this.reporter),
      new ErrorObserver(this.reporter),
      new HttpObserver(this.reporter),
      new BlankScreenObserver(this.reporter),
    ];
  }

  public start() {
    if (this._started) return;
    this._started = true;

    this.reporter.setupUnloadHandler();

    this.observers.forEach((observer) => {
      try {
        observer.observe();
      } catch (error) {
        if (this.config.debug) {
          console.error(
            "[NetworkMonitor] Failed to initialize observer:",
            error
          );
        }
      }
    });
  }

  public stop() {
    this.observers.forEach((observer) => observer.disconnect());
  }
}

// 添加全局类型声明
declare global {
  interface Window {
    __NETWORK_MONITOR_DEBUG__?: boolean;
    __NETWORK_MONITOR_INSTANCE__?: NetworkMonitor;
  }
}
