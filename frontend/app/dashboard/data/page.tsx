'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { formatAmount, formatNumber, formatPct } from '@/lib/formatters';
import { Card, ErrorBanner, KpiTile, PageHeader, Spinner, SuccessBanner, useApi } from '@/components/dashboard/ui';

const OPTIONAL = ['ip_address', 'device_id', 'fraud_scenario'];
const PREVIEW_COLS = [
  'transaction_id', 'customer_id', 'timestamp', 'amount', 'type', 'merchant_category', 'channel',
  'country', 'is_new_device', 'is_vpn', 'ip_risk_score', 'is_fraud',
] as const;

export default function DataPage() {
  const info = useApi(() => api.dataset(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      await fn();
      await info.reload();
      setNotice(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setBusy(null);
    }
  };
  const upload = (file: File) => run('Uploading and retraining', () => api.upload(file), `Loaded ${file.name} and retrained the model.`);

  const d = info.data;
  const years = d ? `${d.min_date.slice(0, 10)} → ${d.max_date.slice(0, 10)}` : '';

  return (
    <>
      <PageHeader
        eyebrow="Model"
        title="Data"
        subtitle="Upload your own labelled transactions (.xlsx or .csv). Every dashboard and the fraud model are rebuilt from it automatically."
      />

      {error && <ErrorBanner message={error} />}
      {notice && <SuccessBanner>{notice}</SuccessBanner>}
      {info.error && <ErrorBanner message={info.error} onRetry={info.reload} />}
      {!d && info.loading && <Spinner />}

      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiTile label="Active dataset" value={d.kind === 'sample' ? 'Sample' : 'Upload'} hint={d.filename} />
            <KpiTile
              label="Rows"
              value={formatNumber(d.rows)}
              hint={`${Object.keys(d.required_columns).length + OPTIONAL.length} columns · ${formatNumber(d.live_rows)} live`}
            />
            <KpiTile label="Date range" value={d.min_date.slice(0, 4)} hint={years} />
            <KpiTile
              label="Fraud rows"
              value={formatNumber(d.fraud_rows)}
              hint={`${formatPct(d.fraud_rows / d.rows, 2)} · ${formatNumber(d.customers)} customers`}
            />
          </div>

          <div className="grid gap-[18px] xl:grid-cols-2">
            <Card title="Upload dataset" subtitle="Validated, stored on the server, and used to retrain the model">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) upload(file);
                }}
              />
              <button
                type="button"
                disabled={!!busy}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) upload(file);
                }}
                className={`flex w-full flex-col items-center gap-2.5 rounded-xl border-[1.5px] border-dashed px-5 py-9 text-center transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  drag ? 'border-accent bg-accent/[0.08]' : 'border-line-strong hover:border-accent hover:bg-accent/[0.08]'
                }`}
              >
                <span className="grid h-[42px] w-[42px] place-items-center rounded-xl border border-line bg-surface-2 text-accent">
                  <Upload className="h-5 w-5" />
                </span>
                {busy ? (
                  <span className="font-semibold">{busy}… this takes about a minute</span>
                ) : (
                  <>
                    <span className="font-semibold">Drop a file or click to browse</span>
                    <span className="text-[13px] text-muted">.xlsx or .csv, up to 100 MB · at least 20 fraud rows</span>
                  </>
                )}
              </button>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn-secondary"
                  disabled={!!busy || d.kind === 'sample'}
                  onClick={() => run('Restoring sample', () => api.resetDataset(), 'Switched back to the bundled 21,000-row sample.')}
                >
                  Restore sample data
                </button>
                <button
                  className="btn-secondary"
                  disabled={!!busy}
                  onClick={() => run('Clearing activity', () => api.resetActivity(), 'Cleared live transactions and analyst reviews.')}
                >
                  Clear live activity
                </button>
              </div>
            </Card>

            <Card title="Expected schema" subtitle="Column names are case-insensitive; one row per transaction">
              <p className="mb-2 text-[13px] font-semibold text-ink-2">Required</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(d.required_columns).map(([col, desc]) => (
                  <code
                    key={col}
                    title={desc}
                    className="rounded-[5px] border border-line bg-surface-3 px-1.5 py-px font-mono text-xs text-ink-2"
                  >
                    {col}
                  </code>
                ))}
              </div>
              <p className="mb-2 mt-4 text-[13px] font-semibold text-ink-2">Optional</p>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONAL.map((col) => (
                  <code key={col} className="rounded-[5px] border border-line bg-surface-3 px-1.5 py-px font-mono text-xs text-muted">
                    {col}
                  </code>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                Hover a column for its meaning. <code className="font-mono text-ink-2">type</code>,{' '}
                <code className="font-mono text-ink-2">channel</code> and{' '}
                <code className="font-mono text-ink-2">merchant_category</code> must use the sample&apos;s values; files that
                fail validation are rejected with a descriptive error.
              </p>
            </Card>
          </div>

          <Card title="Preview" subtitle="First rows of the active dataset">
            <div className="-mx-[22px] overflow-x-auto px-[22px]">
              <table className="data-table">
                <thead>
                  <tr>
                    {PREVIEW_COLS.map((c, i) => (
                      <th key={c} className={i === 0 ? '!pl-0' : ''}>
                        {c.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.preview.map((r) => (
                    <tr key={r.transaction_id}>
                      <td className="!pl-0 font-mono text-[12.5px]">{r.transaction_id}</td>
                      <td className="font-mono text-[12.5px]">{r.customer_id}</td>
                      <td className="tabular-nums">{r.timestamp.slice(0, 16).replace('T', ' ')}</td>
                      <td className="text-right tabular-nums">{formatAmount(r.amount)}</td>
                      <td>{r.type}</td>
                      <td>{r.merchant_category}</td>
                      <td>{r.channel}</td>
                      <td>{r.country}</td>
                      <td className="tabular-nums">{r.is_new_device ? 1 : 0}</td>
                      <td className="tabular-nums">{r.is_vpn ? 1 : 0}</td>
                      <td className="tabular-nums">{r.ip_risk_score.toFixed(3)}</td>
                      <td className={`tabular-nums ${r.is_fraud ? 'font-semibold text-fraud' : ''}`}>{r.is_fraud ? 1 : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
