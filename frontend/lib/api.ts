/**
 * Typed client for the FastAPI backend. All backend access goes through here.
 * Dev: relative URLs are proxied by next.config.mjs. Production: NEXT_PUBLIC_API_URL
 * (e.g. https://fraudies-api.onrender.com) is baked in at build time.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const DOCS_URL = `${API_BASE}/docs`;

export type TxType = 'PURCHASE' | 'TRANSFER' | 'WITHDRAWAL' | 'DEPOSIT';
export type Channel = 'POS' | 'WEB' | 'MOBILE' | 'ATM';
export type TxStatus = 'APPROVED' | 'PENDING' | 'FLAGGED' | 'BLOCKED';

export interface Transaction {
  transaction_id: string;
  customer_id: string;
  timestamp: string;
  amount: number;
  type: TxType;
  merchant_category: string;
  channel: Channel;
  country: string;
  home_country: string;
  ip_address: string | null;
  device_id: string | null;
  account_age_days: number;
  device_age_days: number;
  is_new_device: boolean;
  is_vpn: boolean;
  ip_risk_score: number;
  txn_count_1h: number;
  txn_count_24h: number;
  amount_to_avg_ratio: number;
  distance_from_home_km: number;
  failed_logins_24h: number;
  is_fraud: boolean | null;
  fraud_scenario: string | null;
  risk_score: number;
  risk_factors: string[];
  model_decision: Exclude<TxStatus, 'BLOCKED'>;
  status: TxStatus;
  source: 'dataset' | 'live';
  reviewed_at: string | null;
  review_note: string | null;
}

export interface Contribution {
  feature: string;
  label: string;
  contribution: number;
}

export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Kpis {
  transactions: number;
  volume: number;
  fraud_count: number;
  fraud_rate: number;
  fraud_amount: number;
}

export interface Overview {
  as_of: string;
  kpis: Kpis & {
    avg_risk: number;
    prevented_amount: number;
    missed_amount: number;
    open_alerts: number;
    customers: number;
    approval_rate: number;
  };
  last_30d: Kpis;
  previous_30d: Kpis;
  status_counts: Partial<Record<TxStatus, number>>;
  detection: {
    precision: number;
    recall: number;
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    threshold: number;
  };
}

export interface TimePoint {
  date: string;
  transactions: number;
  volume: number;
  fraud: number;
  flagged: number;
  fraud_amount: number;
  fraud_rate: number;
  avg_risk: number;
}

export interface BreakdownRow {
  key: string;
  transactions: number;
  volume: number;
  fraud: number;
  fraud_rate: number;
  avg_risk: number;
}

export interface HourRow {
  hour: number;
  transactions: number;
  fraud: number;
  fraud_rate: number;
}

export interface RiskBin {
  bin: string;
  label: string;
  legit: number;
  fraud: number;
}

export interface TopCustomer {
  customer_id: string;
  transactions: number;
  volume: number;
  fraud: number;
  fraud_amount: number;
  max_risk: number;
  home_country: string;
  last_seen: string;
}

export interface FilterOptions {
  types: TxType[];
  channels: Channel[];
  categories: string[];
  countries: string[];
  min_date: string;
  max_date: string;
}

export interface ModelComparison {
  model: string;
  cv_pr_auc: number;
  threshold: number;
  roc_auc: number;
  pr_auc: number;
  precision: number;
  recall: number;
  f1: number;
  brier: number;
  train_seconds: number;
  latency_ms: number;
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface ModelInfo {
  model: string;
  version: string;
  trained_at: string;
  thresholds: { flag: number; review: number };
  metrics: {
    selected_model: string;
    selection_metric: string;
    params: Record<string, string | number | null>;
    tuned_cv_pr_auc: number;
    dataset: {
      rows: number;
      fraud_rows: number;
      fraud_rate: number;
      customers: number;
      features: number;
      train_rows: number;
      test_rows: number;
      test_start: string;
    };
    comparison: ModelComparison[];
    test: {
      roc_auc: number;
      pr_auc: number;
      precision: number;
      recall: number;
      f1: number;
      brier: number;
      threshold: number;
      confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
      roc: CurvePoint[];
      pr: CurvePoint[];
      roc_by_model: Record<string, CurvePoint[]>;
    };
    out_of_fold: {
      roc_auc: number;
      pr_auc: number;
      precision: number;
      recall: number;
      f1: number;
      flagged: number;
      caught_fraud: number;
    };
    feature_importance: { feature: string; importance: number }[];
    training_seconds: number;
  };
}

export interface DatasetInfo {
  filename: string;
  kind: 'sample' | 'upload';
  fingerprint: string;
  rows: number;
  live_rows: number;
  fraud_rows: number;
  customers: number;
  min_date: string;
  max_date: string;
  required_columns: Record<string, string>;
  preview: Transaction[];
}

export interface AlertsPage extends Page<Transaction> {
  counts: {
    flagged: number;
    pending: number;
    resolved: number;
    blocked: number;
    cleared: number;
    open_exposure: number;
  };
}

export interface ScoreResult {
  risk_score: number;
  status: Exclude<TxStatus, 'BLOCKED'>;
  contributions: Contribution[];
  factors: string[];
  thresholds: { flag: number; review: number };
}

export interface DashboardFilters {
  start?: string;
  end?: string;
  type?: string[];
  channel?: string[];
  category?: string[];
  country?: string[];
}

type Params = Record<string, string | number | boolean | string[] | undefined | null>;

function query(params?: Params): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit & { params?: Params }): Promise<T> {
  const { params, ...rest } = init ?? {};
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}${query(params)}`, {
      ...rest,
      headers: rest.body instanceof FormData ? rest.headers : { 'Content-Type': 'application/json', ...rest.headers },
    });
  } catch {
    throw new ApiError(
      'Cannot reach the API. If it is hosted on a free Render instance it may be waking up — retry in ~30s.',
      0,
    );
  }
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      const detail = body.detail;
      message = Array.isArray(detail) ? detail.map((d: { msg: string }) => d.msg).join(', ') : detail ?? message;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; model_loaded: boolean; model: string | null; rows: number }>('/api/health'),
  dataset: () => request<DatasetInfo>('/api/dataset'),
  filters: () => request<FilterOptions>('/api/filters'),

  overview: (f?: DashboardFilters) => request<Overview>('/api/overview', { params: { ...f } }),
  timeseries: (bucket: 'day' | 'week' | 'month', f?: DashboardFilters) =>
    request<TimePoint[]>('/api/analytics/timeseries', { params: { bucket, ...f } }),
  breakdown: (dimension: 'type' | 'channel' | 'category' | 'country', f?: DashboardFilters) =>
    request<BreakdownRow[]>('/api/analytics/breakdown', { params: { dimension, ...f } }),
  hourly: (f?: DashboardFilters) => request<HourRow[]>('/api/analytics/hourly', { params: { ...f } }),
  riskDistribution: (f?: DashboardFilters) => request<RiskBin[]>('/api/analytics/risk-distribution', { params: { ...f } }),
  topCustomers: (f?: DashboardFilters) => request<TopCustomer[]>('/api/analytics/top-customers', { params: { ...f } }),

  transactions: (params: Params) => request<Page<Transaction>>('/api/transactions', { params }),
  transaction: (id: string) =>
    request<{ transaction: Transaction; contributions: Contribution[]; customer_history: Transaction[] }>(
      `/api/transactions/${encodeURIComponent(id)}`,
    ),
  createTransaction: (body: Record<string, unknown>) =>
    request<{ transaction: Transaction; contributions: Contribution[] }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  review: (id: string, decision: 'approve' | 'block', note?: string) =>
    request<Transaction>(`/api/transactions/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    }),
  alerts: (params: Params) => request<AlertsPage>('/api/alerts', { params }),

  model: () => request<ModelInfo>('/api/model'),
  score: (body: Record<string, unknown>) =>
    request<ScoreResult>('/api/model/score', { method: 'POST', body: JSON.stringify(body) }),
  retrain: () => request<ModelInfo>('/api/model/retrain', { method: 'POST' }),

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ dataset: DatasetInfo; model: ModelInfo }>('/api/dataset/upload', { method: 'POST', body: form });
  },
  resetDataset: () => request<{ dataset: DatasetInfo; model: ModelInfo }>('/api/dataset/reset', { method: 'POST' }),
  resetActivity: () => request<DatasetInfo>('/api/dataset/reset-activity', { method: 'POST' }),
};
