/// <reference types="node" />

import { Config } from '../types/config';
import { ReportData } from '../types/report';

export class BatchReporter {
  private config: Config;
  private queue: ReportData[] = [];

  constructor(config: Config) {
    this.config = config;
  }

  private shouldSample(sampleRate: number): boolean {
    return Math.random() < sampleRate;
  }

  public push(data: ReportData): void {
    // 根据数据类型获取对应的采样率
    const sampleRate = this.config.sampleRate[data.type] || 1;
    // 执行采样
    if (!this.shouldSample(sampleRate)) {
      return;
    }

    this.queue.push(data);

    if (this.config.debug) {
      console.log('[NetworkMonitor]', data);
    }

    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  public flush(): void {
    if (this.queue.length === 0) return;

    const data = this.queue.slice();
    this.queue = [];

    this.send(data);
  }

  private send(data: ReportData[]): void {
    if (data.length === 0) return;

    const body = JSON.stringify(data);

    if (navigator.sendBeacon && body.length < 64 * 1024) {  // Beacon API 限制
      navigator.sendBeacon(this.config.reportUrl, body);
    } else {
      fetch(this.config.reportUrl, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        // 使用 keepalive 确保数据在页面卸载时也能发送
        keepalive: true,
      }).catch(error => {
        console.error('[BatchReporter] Failed to send data:', error);
      });
    }
  }

  public setupUnloadHandler(): void {
    window.addEventListener('unload', () => {
      this.flush();
    });
  }

  public getConfig(): Config {
    return this.config;
  }
} 