/// <reference types="node" />

import { Config } from '../types/config';
import { Event } from '../types/event';
import { getCookie, setCookie } from '../utils/cookie';
import { uuidv4 } from '../utils/uuid';
import md5 from 'md5';

export class BatchReporter {
  private config: Config;
  private queue: Event[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30000;

  constructor(config: Config) {
    this.config = config;
    this.initSession();
  }

  private initSession() {
    if (!getCookie('lf_first_visit')) {
      const timestamp = Date.now();
      setCookie('lf_session_id', uuidv4());
      setCookie('lf_first_visit', timestamp);
      setCookie('lf_prev_visit', timestamp);
      setCookie('lf_this_visit', timestamp);
      setCookie('lf_session_count', 1);
    }
  }

  private resetSession() {
    const thisVisit = getCookie('lf_this_visit');
    const sessionCount = getCookie('lf_session_count');
    setCookie('lf_prev_visit', thisVisit);
    const timestamp = Date.now();
    setCookie('lf_this_visit', timestamp);
    const totalCount = Number.isNaN(Number(sessionCount)) ? 1 : Number(sessionCount) + 1;
    setCookie('lf_session_count', totalCount);
  }

  private getCommonInfo() {
    const host = window.location.host;
    const hashDomain = md5(host);
    
    let [sessionId, firstVisit, prevVisit, thisVisit, sessionCount] = [
      getCookie('lf_session_id'),
      getCookie('lf_first_visit'),
      getCookie('lf_prev_visit'),
      getCookie('lf_this_visit'),
      getCookie('lf_session_count')
    ];

    if (Number.isNaN(Number(sessionCount)) || !Number(sessionCount)) {
      sessionCount = '1';
      setCookie('lf_session_count', 1);
    }

    return {
      url: window.location.href,
      pathname: window.location.pathname,
      ts: Date.now(),
      view_id: `${window.location.pathname.replace(/^\//, '')}_${Date.now()}`,
      network_type: (navigator as any).connection?.effectiveType || '4g',
      _lfutma: `${hashDomain}.${sessionId}.${firstVisit}.${prevVisit}.${thisVisit}.${sessionCount}`,
      _lfutmb: `${hashDomain}.${thisVisit}.${Date.now()}`,
      _lfutmc: hashDomain
    };
  }

  public push(event: Event) {
    const prevSendTime = Number(getCookie('lf_prev_send_time')) || Date.now();
    const currentTime = Date.now();
    if (currentTime - prevSendTime > 1800000) {
      this.resetSession();
    }
    setCookie('lf_prev_send_time', currentTime);

    if (!this.shouldSample(event)) {
      return;
    }

    if (this.config.debug) {
      console.log('[NetworkMonitor]', event);
    }

    this.queue.push(event);

    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  private shouldSample(event: Event): boolean {
    const sampleRate = this.config.sampleRate[event.type as keyof typeof this.config.sampleRate];
    return Math.random() < (sampleRate || 1);
  }

  private flush() {
    if (this.queue.length === 0) return;

    const events = this.queue.slice();
    this.queue = [];

    const data = {
      common: this.getCommonInfo(),
      batch: events
    };

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
  }

  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        const data = {
          common: this.getCommonInfo(),
          batch: this.queue
        };
        navigator.sendBeacon(this.config.reportUrl, JSON.stringify(data));
      }
    });
  }

  public getConfig(): Config {
    return this.config;
  }

  private sendBeforeUnload(event: Event): void {
    const data = {
      common: this.getCommonInfo(),
      batch: [event]
    };
    navigator.sendBeacon(this.config.reportUrl, JSON.stringify(data));
  }
} 