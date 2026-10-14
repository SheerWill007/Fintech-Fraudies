'use client';

import { useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatNumber, formatPct } from '@/lib/formatters';
import { ImportanceChart, MODEL_COLORS, PrChart, RocChart } from '@/components/dashboard/charts';
import { Card, ErrorBanner, KpiTile, PageHeader, Spinner, buttonClass, useApi } from '@/components/dashboard/ui';

export default function ModelPage() {
  const model = useApi(() => api.model(), []);
  const [retraining, setRetraining] = useState(false);
  const [retrainError, setRetrainError] = useState<string | null>(null);

  const retrain = async () => {
    setRetraining(true);
    setRetrainError(null);
    try {
      model.setData(await api.retrain());
    } catch (e) {
      setRetrainError(e instanceof Error ? e.message : 'Retraining failed');
    } finally {
      setRetraining(false);
    }
  };

  const m = model.data?.metrics;
  const color = model.data ? MODEL_COLORS[model.data.model] ?? '#3b82f6' : '#3b82f6';

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        eyebrow="Machine learning"
        title="Model performance"
        subtitle={
          model.data
            ? `${model.data.model} · v${model.data.version} · trained ${formatDate(model.data.trained_at)} UTC`
            : 'Benchmark, selection and evaluation'
        }
        actions={
          <button className={buttonClass} onClick={retrain} disabled={retraining || !model.data}>
            <RefreshCw className={`h-4 w-4 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining (~1 min)…' : 'Re-run benchmark'}
          </button>
        }
      />

      {model.error && <ErrorBanner message={model.error} onRetry={model.reload} />}
      {retrainError && <ErrorBanner message={retrainError} />}
      {!m && model.loading && <Spinner />}

      {m && model.data && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiTile label="PR-AUC (hold-out)" value={m.test.pr_auc.toFixed(3)} hint={`fraud base rate ${formatPct(m.dataset.fraud_rate, 1)}`} />
            <KpiTile label="ROC-AUC (hold-out)" value={m.test.roc_auc.toFixed(3)} />
            <KpiTile label="Precision @ flag" value={formatPct(m.test.precision)} hint="of flagged are fraud" />
            <KpiTile label="Recall @ flag" value={formatPct(m.test.recall)} hint="of fraud is flagged" />
          </div>

          <Card
            title="Model benchmark"
            subtitle={`Ranked by ${m.selection_metric}. Hold-out = most recent ${formatNumber(m.dataset.test_rows)} transactions (out-of-time).`}
          >
            <div className="-mx-[22px] overflow-x-auto px-[22px]">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <th className="!pl-0">Model</th>
                    <th className="text-right">CV PR-AUC</th>
                    <th className="text-right">Test PR-AUC</th>
                    <th className="text-right">Test ROC-AUC</th>
                    <th className="text-right">Precision</th>
                    <th className="text-right">Recall</th>
                    <th className="text-right">F1</th>
                    <th className="text-right">Train (s)</th>
                    <th className="text-right !normal-case">µs / txn</th>
                  </tr>
                </thead>
                <tbody>
                  {m.comparison.map((r) => {
                    const best = r.model === model.data!.model;
                    return (
                      <tr key={r.model} className={best ? '[&>td]:bg-accent/[0.05]' : ''}>
                        <td className="!pl-0">
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-0.5 w-3 rounded" style={{ background: MODEL_COLORS[r.model] }} />
                            <span className={best ? 'font-semibold text-foreground' : ''}>{r.model}</span>
                            {best && (
                              <span className="tag border-good/25 bg-good/10 text-good">
                                <Trophy className="h-3 w-3" /> selected
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="text-right font-semibold tabular-nums">{r.cv_pr_auc.toFixed(4)}</td>
                        <td className="text-right tabular-nums">{r.pr_auc.toFixed(4)}</td>
                        <td className="text-right tabular-nums">{r.roc_auc.toFixed(4)}</td>
                        <td className="text-right tabular-nums">{r.precision.toFixed(3)}</td>
                        <td className="text-right tabular-nums">{r.recall.toFixed(3)}</td>
                        <td className="text-right tabular-nums">{r.f1.toFixed(3)}</td>
                        <td className="text-right tabular-nums text-muted">{r.train_seconds.toFixed(1)}</td>
                        <td className="text-right tabular-nums text-muted">{(r.latency_ms * 1000).toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Why PR-AUC: with ~{formatPct(m.dataset.fraud_rate, 0)} fraud, ROC-AUC is at least {Math.min(...m.comparison.map((r) => r.roc_auc)).toFixed(2)} for every model and hides real
              differences; precision–recall measures how clean the alert queue is at each catch rate. The winner then gets a
              randomised hyper-parameter search
              {Object.keys(m.params).length
                ? ` (chosen: ${Object.entries(m.params).map(([k, v]) => `${k}=${v}`).join(', ')})`
                : ' — no sampled configuration beat its defaults, so the defaults are kept'}
              . Thresholds come from out-of-fold predictions, never from the test set.
            </p>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="ROC curves — all candidates" subtitle="Out-of-time hold-out set">
              <RocChart curves={m.test.roc_by_model} highlight={model.data.model} />
            </Card>
            <Card title={`Precision–recall — ${model.data.model}`} subtitle={`Area = ${m.test.pr_auc.toFixed(3)}`}>
              <PrChart curve={m.test.pr} color={color} />
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="Confusion matrix" subtitle={`Hold-out @ threshold ${m.test.threshold.toFixed(3)}`}>
              <ConfusionMatrix cm={m.test.confusion_matrix} />
            </Card>
            <Card title="What drives the model" subtitle="Mean |TreeSHAP| per feature group, share of total" className="xl:col-span-2">
              <ImportanceChart data={m.feature_importance} color={color} />
            </Card>
          </div>

          <Card title="Decision policy">
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-faint">Flag (hold)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">score ≥ {model.data.thresholds.flag.toFixed(4)}</p>
                <p className="text-xs text-muted">Max-F1 point on out-of-fold scores.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-faint">Manual review</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">score ≥ {model.data.thresholds.review.toFixed(4)}</p>
                <p className="text-xs text-muted">Lowest score that still reaches ~92% recall.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-faint">Out-of-fold, all {formatNumber(m.dataset.rows)} rows</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatNumber(m.out_of_fold.caught_fraud)} / {formatNumber(m.dataset.fraud_rows)} fraud flagged
                </p>
                <p className="text-xs text-muted">
                  {formatNumber(m.out_of_fold.flagged)} flagged in total · precision {formatPct(m.out_of_fold.precision)}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function ConfusionMatrix({ cm }: { cm: { tn: number; fp: number; fn: number; tp: number } }) {
  const cell = (label: string, value: number, strong: boolean) => (
    <div
      className={`rounded-lg border p-4 text-center ${strong ? 'border-legit/40 bg-legit/15' : 'border-line bg-background'}`}
    >
      <p className="text-2xl font-semibold tabular-nums">{formatNumber(value)}</p>
      <p className="mt-1 text-[11px] text-muted">{label}</p>
    </div>
  );
  return (
    <div>
      <div className="mb-2 grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-[11px] text-faint">
        <span />
        <span className="text-center">Predicted legit</span>
        <span className="text-center">Predicted fraud</span>
      </div>
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
        <span className="w-14 text-[11px] text-faint">Actual legit</span>
        {cell('true negatives', cm.tn, true)}
        {cell('false positives', cm.fp, false)}
        <span className="w-14 text-[11px] text-faint">Actual fraud</span>
        {cell('missed fraud', cm.fn, false)}
        {cell('caught fraud', cm.tp, true)}
      </div>
    </div>
  );
}
