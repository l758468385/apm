export interface ReportData {
  type:
    | "pv"
    | "performance"
    | "performance_timing"
    | "resource"
    | "resource_error"
    | "js_error"
    | "http"
    | "blank_screen";
  payload: any;
  sample_rate: number;
  ts: number;
}
