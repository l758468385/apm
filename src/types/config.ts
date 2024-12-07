export type RouteMode = 'hash' | 'history';

export interface Config {
  aid: string;
  token: string;
  reportUrl: string;
  maxBatchSize: number;
  sampleRate: {
    performance: number;
    resource: number;
    resourceError: number;
    jsError: number;
    http: number;
    blankScreen: number;
  };
  debug?: boolean;
  userId?: string;
  sdkVersion?: string;
  env?: string;
  release?: string;
  routeMode?: RouteMode;
  enableSPA?: boolean;
} 