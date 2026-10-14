'use client';

import { useEffect, useState } from 'react';
import { api, type ScoreResult } from '@/lib/api';
import { formatPct, humanize } from '@/lib/formatters';
import { ContributionChart } from '@/components/dashboard/charts';
import RiskScoreMeter from '@/components/RiskScoreMeter/RiskScoreMeter';
import { Card, ErrorBanner, PageHeader, StatusBadge, inputClass, useApi } from '@/components/dashboard/ui';

interface Scenario {
  amount: number;
  type: string;
  merchant_category: string;
  channel: string;
  country: string;
  home_country: string;
  hour: number;
  amount_to_avg_ratio: number;
  account_age_days: number;
  device_age_days: number;
  is_new_device: boolean;
  is_vpn: boolean;
  ip_risk_score: number;
  txn_count_1h: number;
  txn_count_24h: number;
  failed_logins_24h: number;
}

const PRESETS: Record<string, Scenario> = {
  'Everyday purchase': {
    amount: 42, type: 'PURCHASE', merchant_category: 'grocery', channel: 'POS', country: 'US', home_country: 'US',
    hour: 18, amount_to_avg_ratio: 0.9, account_age_days: 1200, device_age_days: 400, is_new_device: false,
    is_vpn: false, ip_risk_score: 0.08, txn_count_1h: 0, txn_count_24h: 3, failed_logins_24h: 0,
  },
  'Account takeover': {
    amount: 2400, type: 'TRANSFER', merchant_category: 'wire', channel: 'WEB', country: 'RO', home_country: 'US',
    hour: 3, amount_to_avg_ratio: 11, account_age_days: 900, device_age_days: 0, is_new_device: true,
    is_vpn: true, ip_risk_score: 0.7, txn_count_1h: 1, txn_count_24h: 3, failed_logins_24h: 4,
  },
  'Card testing': {
    amount: 3.5, type: 'PURCHASE', merchant_category: 'gift_cards', channel: 'WEB', country: 'US', home_country: 'US',
    hour: 2, amount_to_avg_ratio: 0.05, account_age_days: 700, device_age_days: 1, is_new_device: true,
    is_vpn: true, ip_risk_score: 0.45, txn_count_1h: 11, txn_count_24h: 14, failed_logins_24h: 0,
  },
  'Stolen card, big ticket': {
    amount: 1850, type: 'PURCHASE', merchant_category: 'electronics', channel: 'WEB', country: 'GB', home_country: 'GB',
    hour: 23, amount_to_avg_ratio: 8, account_age_days: 1500, device_age_days: 200, is_new_device: false,
    is_vpn: false, ip_risk_score: 0.3, txn_count_1h: 2, txn_count_24h: 5, failed_logins_24h: 0,
  },
  'Traveller (legit)': {
    amount: 310, type: 'PURCHASE', merchant_category: 'travel', channel: 'POS', country: 'FR', home_country: 'US',
    hour: 14, amount_to_avg_ratio: 4, account_age_days: 2000, device_age_days: 600, is_new_device: false,
    is_vpn: false, ip_risk_score: 0.12, txn_count_1h: 0, txn_count_24h: 4, failed_logins_24h: 0,
  },
};

function toPayload(s: Scenario) {
  const ts = new Date(Date.UTC(2026, 9, 14, s.hour, 15));
  const { hour: _hour, ...rest } = s;
  return { ...rest, timestamp: ts.toISOString() };
}

export default function SimulatorPage() {
  const [preset, setPreset] = useState('Account takeover');
  const [s, setS] = useState<Scenario>(PRESETS['Account takeover']);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const options = useApi(() => api.filters(), []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setResult(await api.score(toPayload(s)));
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Scoring failed');
      }
    }, 250);
    return () => clearTimeout(t);
  }, [s]);

  const set = <K extends keyof Scenario>(k: K, v: Scenario[K]) => setS((prev) => ({ ...prev, [k]: v }));
  const label = 'mb-1 flex justify-between text-xs font-medium text-ink-2';
  const slider = (k: keyof Scenario, text: string, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <div>
      <label className={label}>
        <span>{text}</span>
        <span className="tabular-nums text-foreground">{fmt(s[k] as number)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={s[k] as number}
        onChange={(e) => set(k, Number(e.target.value) as never)}
        className="w-full accent-[#4ade80]"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        eyebrow="Machine learning"
        title="Model simulator"
        subtitle="Build a what-if transaction and watch the live model score it. Nothing is stored."
      />

      <div className="flex flex-wrap gap-2">
        {Object.keys(PRESETS).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPreset(p);
              setS(PRESETS[p]);
            }}
            className={`inline-flex h-[34px] items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
              preset === p
                ? 'border-transparent bg-accent text-black'
                : 'border-line bg-white/[0.06] text-ink-2 hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card title="Transaction" className="xl:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Amount (USD)</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className={inputClass}
                value={s.amount}
                onChange={(e) => set('amount', Math.max(0.01, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className={label}>Type</label>
              <select className={inputClass} value={s.type} onChange={(e) => set('type', e.target.value)}>
                {['PURCHASE', 'TRANSFER', 'WITHDRAWAL', 'DEPOSIT'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Merchant category</label>
              <select className={inputClass} value={s.merchant_category} onChange={(e) => set('merchant_category', e.target.value)}>
                {(options.data?.categories ?? [s.merchant_category]).map((c) => (
                  <option key={c} value={c}>
                    {humanize(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Channel</label>
              <select className={inputClass} value={s.channel} onChange={(e) => set('channel', e.target.value)}>
                {['POS', 'WEB', 'MOBILE', 'ATM'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Transaction country</label>
              <input maxLength={2} className={inputClass} value={s.country} onChange={(e) => set('country', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={label}>Customer home country</label>
              <input
                maxLength={2}
                className={inputClass}
                value={s.home_country}
                onChange={(e) => set('home_country', e.target.value.toUpperCase())}
              />
            </div>
            {slider('hour', 'Hour of day (UTC)', 0, 23, 1, (v) => `${String(v).padStart(2, '0')}:00`)}
            {slider('amount_to_avg_ratio', 'Amount vs 30-day average', 0, 25, 0.1, (v) => `${v.toFixed(1)}×`)}
            {slider('account_age_days', 'Account age', 0, 3000, 1, (v) => `${v} days`)}
            {slider('device_age_days', 'Device age', 0, 1000, 1, (v) => `${v} days`)}
            {slider('ip_risk_score', 'IP reputation risk', 0, 1, 0.01, (v) => v.toFixed(2))}
            {slider('txn_count_1h', 'Transactions in last hour', 0, 20, 1, String)}
            {slider('txn_count_24h', 'Transactions in last 24h', 0, 40, 1, String)}
            {slider('failed_logins_24h', 'Failed logins (24h)', 0, 10, 1, String)}
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" checked={s.is_new_device} onChange={(e) => set('is_new_device', e.target.checked)} />
              First time this device is seen
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" checked={s.is_vpn} onChange={(e) => set('is_vpn', e.target.checked)} />
              VPN / proxy connection
            </label>
          </div>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          {error && <ErrorBanner message={error} />}
          <Card title="Model output">
            {result ? (
              <div className="flex flex-col items-center gap-3">
                <RiskScoreMeter score={result.risk_score} thresholds={result.thresholds} />
                <StatusBadge status={result.status} />
                <p className="text-center text-xs text-muted">
                  Flag at ≥ {formatPct(result.thresholds.flag)}, manual review at ≥ {formatPct(result.thresholds.review, 2)}
                </p>
                {result.factors.length > 0 && result.status !== 'APPROVED' && (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {result.factors.map((f) => (
                      <span key={f} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11.5px] text-ink-2">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted">Scoring…</p>
            )}
          </Card>
          {result && (
            <Card title="Contribution by feature" subtitle="TreeSHAP log-odds — orange raises risk, blue lowers it">
              <ContributionChart data={result.contributions} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
