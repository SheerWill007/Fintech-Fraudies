'use client';

import { useState } from 'react';
import { Ban, Check, X } from 'lucide-react';
import { api, type Transaction } from '@/lib/api';
import { formatAmount, formatDate, formatPct, humanize, riskTextClass } from '@/lib/formatters';
import { ContributionChart } from './charts';
import { ErrorBanner, LabelBadge, Spinner, StatusBadge, inputClass, useApi } from './ui';

export default function TransactionDrawer({
  id,
  thresholds,
  onClose,
  onReviewed,
}: {
  id: string;
  thresholds?: { flag: number; review: number };
  onClose: () => void;
  onReviewed?: (tx: Transaction) => void;
}) {
  const { data, error, loading, reload, setData } = useApi(() => api.transaction(id), [id]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const review = async (decision: 'approve' | 'block') => {
    setBusy(true);
    setReviewError(null);
    try {
      const tx = await api.review(id, decision, note || undefined);
      setData((d) => (d ? { ...d, transaction: tx } : d));
      onReviewed?.(tx);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setBusy(false);
    }
  };

  const tx = data?.transaction;
  const open = tx && (tx.status === 'FLAGGED' || tx.status === 'PENDING');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        data-lenis-prevent
        className="h-full w-full max-w-xl overflow-y-auto border-l border-line bg-background p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Transaction ${id}`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted">{id}</p>
            {tx && <h2 className="mt-1 text-2xl font-semibold tabular-nums">{formatAmount(tx.amount)}</h2>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-white/5" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && !data && <Spinner />}
        {error && <ErrorBanner message={error} onRetry={reload} />}

        {tx && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-line bg-surface p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted">Risk score</p>
                <p className={`mt-1 text-xl font-semibold tabular-nums ${riskTextClass(tx.risk_score, thresholds)}`}>
                  {formatPct(tx.risk_score)}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted">Status</p>
                <div className="mt-2">
                  <StatusBadge status={tx.status} />
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted">Ground truth</p>
                <div className="mt-2">
                  <LabelBadge isFraud={tx.is_fraud} />
                  {tx.fraud_scenario && tx.fraud_scenario !== 'none' && (
                    <p className="text-[11px] text-faint">{humanize(tx.fraud_scenario)}</p>
                  )}
                </div>
              </div>
            </div>

            {open && (
              <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
                <p className="text-sm font-medium">Analyst decision</p>
                <input
                  className={inputClass}
                  placeholder="Note (optional) — e.g. customer confirmed by phone"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                {reviewError && <ErrorBanner message={reviewError} />}
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => review('approve')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm font-medium text-good hover:bg-good/20 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Approve (false positive)
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => review('block')}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-bad/40 bg-bad/15 px-3 py-2 text-sm font-medium text-bad hover:bg-bad/25 disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4" /> Block (confirm fraud)
                  </button>
                </div>
              </div>
            )}
            {tx.reviewed_at && (
              <p className="text-xs text-muted">
                Reviewed {formatDate(tx.reviewed_at)}
                {tx.review_note ? ` — “${tx.review_note}”` : ''}
              </p>
            )}

            <div>
              <h3 className="mb-1 text-sm font-semibold">Why the model scored it this way</h3>
              <p className="mb-3 text-xs text-muted">
                Per-feature TreeSHAP contributions (log-odds). Orange raises risk, blue lowers it.
              </p>
              {data.contributions.length ? (
                <ContributionChart data={data.contributions} />
              ) : (
                <p className="text-xs text-faint">No explanation available for this model type.</p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Customer', tx.customer_id],
                ['Timestamp (UTC)', formatDate(tx.timestamp)],
                ['Type / channel', `${tx.type} · ${tx.channel}`],
                ['Merchant category', humanize(tx.merchant_category)],
                ['Country (home)', `${tx.country} (${tx.home_country})`],
                ['Distance from home', `${Math.round(tx.distance_from_home_km).toLocaleString()} km`],
                ['Amount vs 30-day avg', `${tx.amount_to_avg_ratio.toFixed(2)}×`],
                ['Velocity 1h / 24h', `${tx.txn_count_1h} / ${tx.txn_count_24h}`],
                ['Account age', `${Math.round(tx.account_age_days)} days`],
                ['Device', tx.is_new_device ? 'New device' : `Known for ${Math.round(tx.device_age_days)} days`],
                ['IP address', `${tx.ip_address ?? '—'}${tx.is_vpn ? ' · VPN' : ''}`],
                ['IP risk', tx.ip_risk_score.toFixed(2)],
                ['Failed logins 24h', String(tx.failed_logins_24h)],
                ['Model decision', tx.model_decision],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-wider text-faint">{k}</dt>
                  <dd className="mt-0.5 break-all text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>

            {data.customer_history.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Customer’s recent activity</h3>
                <div className="divide-y divide-line rounded-lg border border-line">
                  {data.customer_history.map((h) => (
                    <div key={h.transaction_id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                      <span className="text-muted">{formatDate(h.timestamp)}</span>
                      <span className="text-muted">{humanize(h.merchant_category)}</span>
                      <span className="tabular-nums">{formatAmount(h.amount)}</span>
                      <span className={`tabular-nums ${riskTextClass(h.risk_score, thresholds)}`}>
                        {formatPct(h.risk_score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
