'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, RefreshCw, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { api, type BreakdownRow, type HourRow, type Overview } from '@/lib/api';
import { formatAmount, formatDate, formatNumber, formatPct, humanize, riskTextClass } from '@/lib/formatters';
import FilterBar, { type FilterState } from '@/components/dashboard/FilterBar';
import TransactionDrawer from '@/components/dashboard/TransactionDrawer';
import {
  FRAUD,
  FraudRateBars,
  HourlyChart,
  RiskDistributionChart,
  TrendChart,
  type TrendMetric,
} from '@/components/dashboard/charts';
import { Card, ErrorBanner, KpiTile, PageHeader, Spinner, StatusBadge, useApi } from '@/components/dashboard/ui';

function change(current: number, previous: number): number | null {
  return previous ? (current - previous) / previous : null;
}

type Tone = 'green' | 'red' | 'amber' | 'blue';
const TONE: Record<Tone, string> = {
  green: 'bg-good/10 text-good',
  red: 'bg-bad/10 text-bad',
  amber: 'bg-warn/10 text-warn',
  blue: 'bg-info/10 text-info',
};

function buildInsights(ov: Overview, categories: BreakdownRow[], hours: HourRow[]) {
  const items: { icon: typeof Clock; tone: Tone; title: React.ReactNode; sub: string }[] = [];
  const now = ov.last_30d.fraud_rate;
  const before = ov.previous_30d.fraud_rate;
  const delta = change(now, before);
  if (delta !== null) {
    const down = delta <= 0;
    items.push({
      icon: down ? TrendingDown : TrendingUp,
      tone: down ? 'green' : 'red',
      title: (
        <>
          Fraud rate is <strong>{down ? 'down' : 'up'} {formatPct(Math.abs(delta))}</strong> over the last 30 days
        </>
      ),
      sub: `${formatPct(now, 2)} vs ${formatPct(before, 2)} in the prior 30 days`,
    });
  }
  const riskiest = [...categories].filter((c) => c.transactions >= 50).sort((a, b) => b.fraud_rate - a.fraud_rate)[0];
  if (riskiest) {
    items.push({
      icon: AlertTriangle,
      tone: 'amber',
      title: (
        <>
          <strong>{humanize(riskiest.key)}</strong> has the highest fraud rate at {formatPct(riskiest.fraud_rate)}
        </>
      ),
      sub: `${formatNumber(riskiest.fraud)} of ${formatNumber(riskiest.transactions)} transactions — tighten limits here`,
    });
  }
  const peak = [...hours].sort((a, b) => b.fraud_rate - a.fraud_rate)[0];
  if (peak && peak.transactions) {
    items.push({
      icon: Clock,
      tone: 'blue',
      title: (
        <>
          Fraud peaks at <strong>{String(peak.hour).padStart(2, '0')}:00 UTC</strong>
        </>
      ),
      sub: `${formatPct(peak.fraud_rate)} of transactions in that hour are fraudulent`,
    });
  }
  items.push({
    icon: ShieldCheck,
    tone: 'green',
    title: (
      <>
        Model catches <strong>{formatPct(ov.detection.recall, 0)}</strong> of fraud at {formatPct(ov.detection.precision, 0)} precision
      </>
    ),
    sub: `${formatAmount(ov.kpis.prevented_amount, true)} prevented · ${formatAmount(ov.kpis.missed_amount, true)} missed`,
  });
  return items;
}

export default function OverviewPage() {
  const [filters, setFilters] = useState<FilterState>({ range: 0 });
  const [metric, setMetric] = useState<TrendMetric>('volume');
  const [selected, setSelected] = useState<string | null>(null);
  const { range, ...f } = filters;
  const key = JSON.stringify(f);
  const bucket = !f.start && !f.end ? 'week' : range && range <= 30 ? 'day' : 'week';

  const options = useApi(() => api.filters(), []);
  const model = useApi(() => api.model(), []);
  const data = useApi(
    async () => {
      const [overview, series, categories, channels, hours, risk, customers, alerts] = await Promise.all([
        api.overview(f),
        api.timeseries(bucket, f),
        api.breakdown('category', f),
        api.breakdown('channel', f),
        api.hourly(f),
        api.riskDistribution(f),
        api.topCustomers(f),
        api.alerts({ view: 'open', page_size: 6 }),
      ]);
      return { overview, series, categories, channels, hours, risk, customers, alerts };
    },
    [key, bucket],
  );

  const d = data.data;
  const k = d?.overview.kpis;
  const thresholds = model.data?.thresholds;
  const spark = d?.series.slice(-12) ?? [];
  const totalFraud = d ? d.channels.reduce((s, c) => s + c.fraud, 0) || 1 : 1;

  return (
    <>
      <PageHeader
        eyebrow="Monitoring"
        title="Fraud overview"
        subtitle="Volume, fraud and model decisions across the selected period, types, channels and categories."
        actions={
          <>
            {d?.overview.as_of && (
              <span className="tag border-line-strong bg-surface-2 text-ink-2">
                Data to {formatDate(d.overview.as_of).split(',').slice(0, 2).join(',')}
              </span>
            )}
            <button className="icon-btn" onClick={data.reload} disabled={data.loading} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
            </button>
          </>
        }
      />

      <FilterBar options={options.data} value={filters} onChange={setFilters} />

      {data.error && <ErrorBanner message={data.error} onRetry={data.reload} />}
      {!d && data.loading && <Spinner label="Loading 21,000 transactions…" />}

      {d && k && (
        <div className={`flex flex-col gap-[18px] transition-opacity duration-200 ${data.loading ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
            <KpiTile
              label="Transaction volume"
              value={formatAmount(k.volume, true)}
              hint="last 30d vs prior"
              delta={change(d.overview.last_30d.volume, d.overview.previous_30d.volume)}
              spark={spark.map((p) => p.volume)}
            />
            <KpiTile
              label="Transactions"
              value={formatNumber(k.transactions, true)}
              hint={`${formatNumber(k.customers)} customers`}
              delta={change(d.overview.last_30d.transactions, d.overview.previous_30d.transactions)}
              spark={spark.map((p) => p.transactions)}
            />
            <KpiTile
              label="Fraud rate"
              value={formatPct(k.fraud_rate, 2)}
              hint={`${formatNumber(k.fraud_count)} cases`}
              delta={change(d.overview.last_30d.fraud_rate, d.overview.previous_30d.fraud_rate)}
              deltaGoodWhen="down"
              spark={spark.map((p) => p.fraud_rate)}
              sparkColor={FRAUD}
            />
            <KpiTile
              label="Fraud prevented"
              value={formatAmount(k.prevented_amount, true)}
              hint={`${formatAmount(k.missed_amount, true)} missed`}
            />
            <KpiTile label="Open alerts" value={formatNumber(k.open_alerts)} hint="flagged + pending review" />
            <KpiTile
              label="Detection precision"
              value={formatPct(d.overview.detection.precision, 1)}
              hint={`recall ${formatPct(d.overview.detection.recall, 1)}`}
            />
          </div>

          <div className="grid gap-[18px] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card
              title="Performance trend"
              subtitle={`${bucket === 'week' ? 'Weekly' : 'Daily'} totals for the selected slice`}
              action={
                <div className="segmented" role="group" aria-label="Metric">
                  {(
                    [
                      ['volume', 'Volume'],
                      ['transactions', 'Transactions'],
                      ['fraud', 'Fraud cases'],
                    ] as const
                  ).map(([m, label]) => (
                    <button key={m} aria-pressed={metric === m} onClick={() => setMetric(m)}>
                      {label}
                    </button>
                  ))}
                </div>
              }
            >
              <TrendChart data={d.series} metric={metric} />
            </Card>

            <Card title="Key insights" subtitle="Generated from the current selection">
              <div className="flex flex-col">
                {buildInsights(d.overview, d.categories, d.hours).map((it, i) => {
                  const Icon = it.icon;
                  return (
                    <div key={i} className={`flex gap-3 border-line py-[13px] ${i ? 'border-t' : 'pt-0.5'}`}>
                      <span className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-lg ${TONE[it.tone]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[13.5px] leading-normal text-ink-2 [&_strong]:font-semibold [&_strong]:text-foreground">
                          {it.title}
                        </p>
                        <span className="mt-0.5 block text-xs text-muted">{it.sub}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="grid gap-[18px] xl:grid-cols-3">
            <Card title="Fraud rate by category" subtitle="Share of transactions that are fraud">
              <FraudRateBars data={d.categories} />
            </Card>

            <Card title="Fraud share by channel" subtitle="Where confirmed fraud comes in">
              <div className="flex flex-col gap-3.5">
                {[...d.channels]
                  .sort((a, b) => b.fraud - a.fraud)
                  .map((c) => (
                    <div key={c.key} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[13.5px]">
                      <span>{c.key}</span>
                      <span className="tabular-nums text-muted">
                        {formatNumber(c.fraud)} · {formatPct(c.fraud / totalFraud)}
                      </span>
                      <div className="col-span-2 h-1.5 overflow-hidden rounded-[3px] bg-surface-3">
                        <i className="block h-full rounded-[3px] bg-fraud" style={{ width: `${(c.fraud / totalFraud) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-6 border-t border-line pt-4">
                <p className="mb-2.5 text-xs text-muted">Decision mix</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['APPROVED', 'PENDING', 'FLAGGED', 'BLOCKED'] as const).map((s) => (
                    <div key={s} className="flex items-center justify-between gap-2 text-xs">
                      <StatusBadge status={s} />
                      <span className="tabular-nums text-ink-2">{formatNumber(d.overview.status_counts[s] ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card
              title="Highest-risk alerts"
              subtitle="Open, sorted by model score"
              action={
                <Link href="/dashboard/alerts" className="text-[13px] font-medium text-accent hover:underline">
                  View queue →
                </Link>
              }
            >
              {d.alerts.rows.length === 0 ? (
                <p className="py-6 text-center text-muted">Queue is clear.</p>
              ) : (
                <div className="flex flex-col">
                  {d.alerts.rows.map((a, i) => (
                    <button
                      key={a.transaction_id}
                      onClick={() => setSelected(a.transaction_id)}
                      className={`flex w-full items-center gap-3 border-line py-2.5 text-left transition-colors hover:bg-white/[0.03] ${i ? 'border-t' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold">
                          {formatAmount(a.amount)} <span className="font-normal text-muted">· {humanize(a.merchant_category)}</span>
                        </p>
                        <p className="truncate text-xs text-muted">{a.risk_factors[0] ?? a.customer_id}</p>
                      </div>
                      <span className={`text-[13.5px] font-bold tabular-nums ${riskTextClass(a.risk_score, thresholds)}`}>
                        {formatPct(a.risk_score, 0)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-[18px] xl:grid-cols-2">
            <Card title="Risk score distribution" subtitle="Each class as a share of itself — little overlap means clean separation">
              <RiskDistributionChart data={d.risk} flag={thresholds?.flag} />
            </Card>
            <Card title="Fraud rate by hour of day" subtitle="UTC — fraud skews to the night">
              <HourlyChart data={d.hours} />
            </Card>
          </div>

          <Card title="Most exposed customers" subtitle="Ranked by confirmed fraud amount">
            <div className="-mx-[22px] overflow-x-auto px-[22px]">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="!pl-0">Customer</th>
                    <th>Home</th>
                    <th className="text-right">Transactions</th>
                    <th className="text-right">Volume</th>
                    <th className="text-right">Fraud cases</th>
                    <th className="text-right">Fraud amount</th>
                    <th className="text-right">Max risk</th>
                    <th className="!pr-0 text-right">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {d.customers.map((c) => (
                    <tr key={c.customer_id}>
                      <td className="!pl-0">
                        <Link
                          className="font-mono text-[12.5px] hover:text-accent"
                          href={`/dashboard/transactions?search=${encodeURIComponent(c.customer_id)}`}
                        >
                          {c.customer_id}
                        </Link>
                      </td>
                      <td>{c.home_country}</td>
                      <td className="text-right tabular-nums">{c.transactions}</td>
                      <td className="text-right tabular-nums">{formatAmount(c.volume)}</td>
                      <td className="text-right tabular-nums">{c.fraud}</td>
                      <td className="text-right tabular-nums">{formatAmount(c.fraud_amount)}</td>
                      <td className={`text-right font-semibold tabular-nums ${riskTextClass(c.max_risk, thresholds)}`}>
                        {formatPct(c.max_risk, 0)}
                      </td>
                      <td className="!pr-0 text-right text-muted">{formatDate(c.last_seen).split(',').slice(0, 2).join(',')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {selected && (
        <TransactionDrawer
          id={selected}
          thresholds={thresholds}
          onClose={() => setSelected(null)}
          onReviewed={() => data.reload()}
        />
      )}
    </>
  );
}
