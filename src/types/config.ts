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
} 