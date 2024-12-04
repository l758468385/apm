/// <reference types="node" />

import { Config } from '../types/config';
import { Event } from '../types/event';

export class BatchReporter {
  private config: Config;
  private queue: Event[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5秒

  constructor(config: Config) {
    this.config = config;
  }

  public push(event: Event) {
    if (!this.shouldSample(event)) {
      return;
    }

    if (this.config.debug) {
      console.log('[NetworkMonitor]', event);
    }

    this.queue.push(event);
    this.scheduleFlush(event);
  }

  private shouldSample(event: Event): boolean {
    const sampleRate = this.config.sampleRate[event.type as keyof typeof this.config.sampleRate];
    return Math.random() < (sampleRate || 1);
  }

  private scheduleFlush(event: Event) {
    if (['js_error', 'resource_error', 'blank_screen'].includes(event.type)) {
      this.flush(true);
      return;
    }

    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush(false);
      return;
    }

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(false), this.FLUSH_INTERVAL);
    }
  }

  private flush(highPriority: boolean = false) {
    if (this.queue.length === 0) return;

    const data = this.queue.slice();
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (highPriority) {
      fetch(this.config.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Aid': this.config.aid,
          'X-Token': this.config.token
        },
        body: JSON.stringify(data)
      }).catch(error => {
        if (this.config.debug) {
          console.error('[NetworkMonitor] Failed to send data:', error);
        }
      });
    } else if (navigator.sendBeacon) {
      navigator.sendBeacon(this.config.reportUrl, JSON.stringify(data));
    }
  }

  // 页面卸载时发送剩余数据
  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        navigator.sendBeacon('/collect', JSON.stringify(this.queue));
      }
    });
  }
} 