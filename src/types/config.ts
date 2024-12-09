export type RouteMode = 'hash' | 'history';

export interface Config {
  aid: string;
  token: string;
  reportUrl: string;
  maxBatchSize: number;
  sampleRate: {
    pv: number;
    performance: number;
    performance_timing: number;
    resource: number;
    resource_error:number;
    js_error: number;
    http: number;
    blank_screen: number;
  };
  debug?: boolean;
  userId?: string;
  sdkVersion?: string;
  env?: string;
  release?: string;
  routeMode?: RouteMode;
  enableSPA?: boolean;
} 