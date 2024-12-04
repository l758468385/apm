export interface Event {
  type: string;
  payload: any;
  sample_rate?: number;
  ts: number;
} 