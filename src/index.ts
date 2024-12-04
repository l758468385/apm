import { NetworkMonitor } from './core/NetworkMonitor';
import { Config } from './types/config';

(function(window: Window, document: Document) {
  const defaultConfig = {
    maxBatchSize: 20,
    reportUrl: 'https://your-analytics-endpoint.com/collect',
    sampleRate: {
      performance: 1,
      resource: 0.5,
      resourceError: 1,
      jsError: 1,
      http: 0.5,
      blankScreen: 1
    }
  };

  function init(userConfig: Partial<Config>) {
    const config: Config = {
      aid: userConfig.aid || '',
      token: userConfig.token || '',
      reportUrl: userConfig.reportUrl || defaultConfig.reportUrl,
      maxBatchSize: userConfig.maxBatchSize || defaultConfig.maxBatchSize,
      sampleRate: userConfig.sampleRate || defaultConfig.sampleRate,
      debug: userConfig.debug || false
    };
    
    if (config.debug) {
      window.__NETWORK_MONITOR_DEBUG__ = true;
    }
    
    const monitor = new NetworkMonitor(config);
    monitor.start();
  }

  // 创建全局函数
  const globalName = 'networkMonitor';
  (window as any)[globalName] = {
    init
  };

  // 自动注入初始化代码
  const script = document.currentScript as HTMLScriptElement;
  if (script) {
    const aid = script.getAttribute('data-aid');
    const token = script.getAttribute('data-token');
    if (aid && token) {
      init({ aid, token });
    }
  }
})(window, document); 