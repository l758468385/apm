export interface SampleConfig {
  performance: number;
  resource: number;
  resourceError: number;
  jsError: number;
  http: number;
  blankScreen: number;
}

export interface Config {
  aid: string;
  token: string;
  reportUrl: string;
  maxBatchSize: number;
  sampleRate: SampleConfig;
  debug?: boolean;
} 