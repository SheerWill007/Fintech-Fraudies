'use client';

import { useState } from 'react';
import { Ban, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { formatAmount, formatDate, formatNumber, formatPct, formatRelativeTime, humanize, riskTextClass } from '@/lib/formatters';
import TransactionDrawer from '@/components/dashboard/TransactionDrawer';
import {
  ErrorBanner,
  KpiTile,
  LabelBadge,
  PageHeader,
  Pagination,
  PillSelect,
  Spinner,
  StatusBadge,
  buttonClass,
  useApi,
} from '@/components/dashboard/ui';

export default function AlertsPage() {
  const [view, setView] = useState<'open' | 'resolved'>('open');
  const [status, setStatus] = useState<'' | 'FLAGGED' | 'PENDING'>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const model = useApi(() => api.model(), []);
  const alerts = useApi(
    () => api.alerts({ view, status: view === 'open' ? status || undefined : undefined, page, page_size: 20 }),
    [view, status, page],
  );
  const counts = alerts.data?.counts;

  const decide = async (id: string, decision: 'approve' | 'block') => {
    setBusy(id);
    setActionError(null);
    try {
      await api.review(id, decision);
      await alerts.reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setBusy(null);
    }
  };

  const tab = (v: 'open' | 'resolved', label: string) => (
    <button
      aria-pressed={view === v}
      onClick={() => {
        setView(v);
        setPage(1);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        eyebrow="Monitoring"
        title="Alerts queue"
        subtitle="FLAGGED transactions were held by the model; PENDING sit in the manual-review band. Decide each one."
        actions={
          <button className={buttonClass} onClick={alerts.reload} disabled={alerts.loading}>
            <RefreshCw className={`h-4 w-4 ${alerts.loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {counts && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiTile label="Flagged" value={formatNumber(counts.flagged)} hint="held by the model" />
          <KpiTile label="Pending review" value={formatNumber(counts.pending)} hint="manual-review band" />
          <KpiTile label="Open exposure" value={formatAmount(counts.open_exposure, true)} hint="amount awaiting a decision" />
          <KpiTile
            label="Resolved"
            value={formatNumber(counts.resolved)}
            hint={`${formatNumber(counts.blocked)} blocked · ${formatNumber(counts.cleared)} cleared`}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="segmented" role="group" aria-label="Queue view">
          {tab('open', 'Open')}
          {tab('resolved', 'Resolved')}
        </div>
        {view === 'open' && (
          <PillSelect
            label="Show"
            allLabel="Flagged + pending"
            value={status}
            onChange={(v) => {
              setStatus(v as typeof status);
              setPage(1);
            }}
            options={[
              { value: 'FLAGGED', label: 'Flagged only' },
              { value: 'PENDING', label: 'Pending only' },
            ]}
          />
        )}
      </div>

      {alerts.error && <ErrorBanner message={alerts.error} onRetry={alerts.reload} />}
      {actionError && <ErrorBanner message={actionError} />}
      {!alerts.data && alerts.loading && <Spinner />}

      {alerts.data && alerts.data.total === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-line p-16 text-center">
          <ShieldCheck className="mb-3 h-8 w-8 text-good" />
          <p className="font-semibold">{view === 'open' ? 'Queue is clear' : 'Nothing resolved yet'}</p>
          <p className="mt-1 text-sm text-muted">New high-risk transactions will appear here as they are scored.</p>
        </div>
      )}

      {alerts.data && alerts.data.total > 0 && (
        <div className={`overflow-hidden rounded-2xl border border-line bg-surface ${alerts.loading ? 'opacity-60' : ''}`}>
          <div className="divide-y divide-line">
            {alerts.data.rows.map((a) => (
              <div key={a.transaction_id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                <button className="min-w-0 flex-1 text-left" onClick={() => setSelected(a.transaction_id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums">{formatAmount(a.amount)}</span>
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-muted">
                      {a.type} · {humanize(a.merchant_category)} · {a.channel} · {a.country}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    <span className="font-mono">{a.transaction_id}</span> · {a.customer_id} · {formatDate(a.timestamp)}
                  </p>
                  {a.risk_factors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.risk_factors.slice(0, 4).map((f) => (
                        <span key={f} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11.5px] text-ink-2">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {view === 'resolved' && (
                    <p className="mt-2 text-xs text-muted">
                      {a.reviewed_at && formatRelativeTime(a.reviewed_at)} · {a.review_note} · label <LabelBadge isFraud={a.is_fraud} />
                    </p>
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-16 text-right">
                    <p className={`text-lg font-semibold tabular-nums ${riskTextClass(a.risk_score, model.data?.thresholds)}`}>
                      {formatPct(a.risk_score, 0)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-faint">risk</p>
                  </div>
                  {view === 'open' && (
                    <>
                      <button
                        disabled={busy === a.transaction_id}
                        onClick={() => decide(a.transaction_id, 'approve')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-xs font-medium text-good hover:bg-good/20 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        disabled={busy === a.transaction_id}
                        onClick={() => decide(a.transaction_id, 'block')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-bad/40 bg-bad/15 px-3 py-2 text-xs font-medium text-bad hover:bg-bad/25 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" /> Block
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={alerts.data.page} pages={alerts.data.pages} total={alerts.data.total} onPage={setPage} />
        </div>
      )}

      {selected && (
        <TransactionDrawer
          id={selected}
          thresholds={model.data?.thresholds}
          onClose={() => setSelected(null)}
          onReviewed={() => alerts.reload()}
        />
      )}
    </div>
  );
}
