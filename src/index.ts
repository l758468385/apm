import { NetworkMonitor } from './core/NetworkMonitor';
import { Config, RouteMode } from './types/config';
import { version } from '../package.json';  // 需要在 tsconfig.json 中启用 resolveJsonModule

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
    },
    routeMode: 'history',
    enableSPA: false,
    sdkVersion: version  // 使用 package.json 中的版本号
  };

  function init(userConfig: Partial<Config>) {
    const config: Config = {
      aid: userConfig.aid || '',
      token: userConfig.token || '',
      reportUrl: userConfig.reportUrl || defaultConfig.reportUrl,
      maxBatchSize: userConfig.maxBatchSize || defaultConfig.maxBatchSize,
      sampleRate: {
        ...defaultConfig.sampleRate,
        ...userConfig.sampleRate
      },
      debug: userConfig.debug || false,
      // 新增配置项
      userId: userConfig.userId,
      sdkVersion: userConfig.sdkVersion || defaultConfig.sdkVersion,
      env: userConfig.env,
      release: userConfig.release,
      routeMode: userConfig.routeMode as RouteMode || defaultConfig.routeMode,
      enableSPA: userConfig.enableSPA ?? defaultConfig.enableSPA
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
    init,
    version: defaultConfig.sdkVersion,  // 暴露版本号
    setUserId: (userId: string) => {
      // 支持动态设置用户ID
      if (window.__NETWORK_MONITOR_INSTANCE__) {
        window.__NETWORK_MONITOR_INSTANCE__.setUserId(userId);
      }
    }
  };

  // 自动注入初始化代码
  const script = document.currentScript as HTMLScriptElement;
  if (script) {
    const aid = script.getAttribute('data-aid');
    const token = script.getAttribute('data-token');
    const userId = script.getAttribute('data-user-id');
    const env = script.getAttribute('data-env');
    if (aid && token) {
      init({ 
        aid, 
        token,
        userId: userId || undefined,
        env: env || undefined
      });
    }
  }
})(window, document); 