'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
import { api, type Contribution, type Transaction } from '@/lib/api';
import { formatAmount, formatDate, formatPct, humanize, riskTextClass } from '@/lib/formatters';
import TransactionDrawer from '@/components/dashboard/TransactionDrawer';
import {
  ErrorBanner,
  LabelBadge,
  PageHeader,
  Pagination,
  PillSelect,
  Spinner,
  StatusBadge,
  inputClass,
  primaryButtonClass,
  useApi,
} from '@/components/dashboard/ui';

type Sort = 'timestamp' | 'amount' | 'risk_score';

function TransactionsView() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [query, setQuery] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [minRisk, setMinRisk] = useState(0);
  const [sort, setSort] = useState<Sort>('timestamp');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const s = params.get('search') ?? '';
    setSearch(s);
    setQuery(s);
    setPage(1);
  }, [params]);

  const options = useApi(() => api.filters(), []);
  const model = useApi(() => api.model(), []);
  const list = useApi(
    () =>
      api.transactions({
        search: query || undefined,
        status: status ? [status] : undefined,
        label: label || undefined,
        type: type ? [type] : undefined,
        category: category ? [category] : undefined,
        min_risk: minRisk || undefined,
        sort,
        order,
        page,
        page_size: 25,
      }),
    [query, status, label, type, category, minRisk, sort, order, page],
  );

  const setFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const toggleSort = (col: Sort) => {
    if (sort === col) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSort(col);
      setOrder('desc');
    }
    setPage(1);
  };
  const SortIcon = ({ col }: { col: Sort }) =>
    sort === col ? order === 'desc' ? <ArrowDown className="h-3 w-3 text-accent" /> : <ArrowUp className="h-3 w-3 text-accent" /> : null;

  return (
    <>
      <PageHeader
        eyebrow="Monitoring"
        title="Transactions"
        subtitle="Every transaction with its out-of-fold model score. Click a row for the explanation."
        actions={
          <button className={primaryButtonClass} onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Score new transaction
          </button>
        }
      />

      <div className="relative z-10 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2">
        <form
          className="flex h-9 min-w-[240px] flex-1 items-center gap-2 rounded-[9px] border border-line bg-surface-2 px-3 text-muted focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/30"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <Search className="h-4 w-4 flex-none" />
          <input
            className="w-full bg-transparent text-[13.5px] text-foreground placeholder:text-faint focus:outline-none"
            placeholder="ID, customer, IP or device — press Enter"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <PillSelect
          label="Status"
          value={status}
          onChange={setFilter(setStatus)}
          options={['APPROVED', 'PENDING', 'FLAGGED', 'BLOCKED'].map((v) => ({ value: v, label: humanize(v.toLowerCase()) }))}
        />
        <PillSelect
          label="Label"
          value={label}
          onChange={setFilter(setLabel)}
          options={[
            { value: 'fraud', label: 'Fraud' },
            { value: 'legit', label: 'Legit' },
            { value: 'unknown', label: 'Unlabelled' },
          ]}
        />
        <PillSelect
          label="Type"
          value={type}
          onChange={setFilter(setType)}
          options={(options.data?.types ?? []).map((t) => ({ value: t, label: humanize(t.toLowerCase()) }))}
        />
        <PillSelect
          label="Category"
          value={category}
          onChange={setFilter(setCategory)}
          options={(options.data?.categories ?? []).map((c) => ({ value: c, label: humanize(c) }))}
        />
        <PillSelect
          label="Risk"
          allLabel="Any"
          value={minRisk ? String(minRisk) : ''}
          onChange={(v) => setFilter(setMinRisk)(Number(v) || 0)}
          options={[
            { value: '0.1', label: '≥ 10%' },
            { value: '0.5', label: '≥ 50%' },
            { value: '0.9', label: '≥ 90%' },
          ]}
        />
      </div>

      {list.error && <ErrorBanner message={list.error} onRetry={list.reload} />}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto px-[22px] pt-2">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th className="!pl-0">Transaction</th>
                <th>Customer</th>
                <th>
                  <button className="flex items-center gap-1 uppercase tracking-[0.06em] hover:text-foreground" onClick={() => toggleSort('timestamp')}>
                    Time (UTC) <SortIcon col="timestamp" />
                  </button>
                </th>
                <th>Category · channel</th>
                <th className="text-right">
                  <button className="ml-auto flex items-center gap-1 uppercase tracking-[0.06em] hover:text-foreground" onClick={() => toggleSort('amount')}>
                    <SortIcon col="amount" /> Amount
                  </button>
                </th>
                <th className="text-right">
                  <button className="ml-auto flex items-center gap-1 uppercase tracking-[0.06em] hover:text-foreground" onClick={() => toggleSort('risk_score')}>
                    <SortIcon col="risk_score" /> Risk
                  </button>
                </th>
                <th>Status</th>
                <th className="!pr-0">Label</th>
              </tr>
            </thead>
            <tbody className={`transition-opacity ${list.loading ? 'opacity-50' : ''}`}>
              {list.data?.rows.map((tx) => (
                <tr key={tx.transaction_id} onClick={() => setSelected(tx.transaction_id)} className="cursor-pointer">
                  <td className="!pl-0">
                    <span className="block font-mono text-[12.5px] text-foreground">{tx.transaction_id}</span>
                    <span className="text-[11px] text-faint">
                      {tx.type}
                      {tx.source === 'live' ? ' · live' : ''}
                    </span>
                  </td>
                  <td className="font-mono text-[12.5px]">{tx.customer_id}</td>
                  <td className="text-muted">{formatDate(tx.timestamp)}</td>
                  <td>
                    {humanize(tx.merchant_category)} · {tx.channel}
                    {tx.country !== tx.home_country && <span className="ml-1 text-faint">({tx.country})</span>}
                  </td>
                  <td className="text-right font-semibold tabular-nums text-foreground">{formatAmount(tx.amount)}</td>
                  <td className={`text-right font-semibold tabular-nums ${riskTextClass(tx.risk_score, model.data?.thresholds)}`}>
                    {formatPct(tx.risk_score)}
                  </td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="!pr-0">
                    <LabelBadge isFraud={tx.is_fraud} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.data && list.loading && <Spinner />}
        {list.data && list.data.total === 0 && (
          <p className="p-8 text-center text-sm text-muted">No transactions match these filters.</p>
        )}
        {list.data && <Pagination page={list.data.page} pages={list.data.pages} total={list.data.total} onPage={setPage} />}
      </div>

      {selected && (
        <TransactionDrawer
          id={selected}
          thresholds={model.data?.thresholds}
          onClose={() => setSelected(null)}
          onReviewed={() => list.reload()}
        />
      )}
      {showCreate && (
        <CreateTransactionModal
          categories={options.data?.categories ?? []}
          onClose={() => setShowCreate(false)}
          onCreated={(tx) => {
            list.reload();
            setShowCreate(false);
            setSelected(tx.transaction_id);
          }}
        />
      )}
    </>
  );
}

function CreateTransactionModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: string[];
  onClose: () => void;
  onCreated: (tx: Transaction, contributions: Contribution[]) => void;
}) {
  const [form, setForm] = useState({
    customer_id: 'CUST-00042',
    amount: '249.99',
    type: 'PURCHASE',
    merchant_category: 'electronics',
    channel: 'WEB',
    country: 'US',
    ip_address: '',
    device_id: '',
    is_vpn: false,
    ip_risk_score: '',
    failed_logins_24h: '0',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.createTransaction({
        customer_id: form.customer_id,
        amount: Number(form.amount),
        type: form.type,
        merchant_category: form.merchant_category,
        channel: form.channel,
        country: form.country,
        ip_address: form.ip_address || undefined,
        device_id: form.device_id || undefined,
        is_vpn: form.is_vpn,
        ip_risk_score: form.ip_risk_score === '' ? undefined : Number(form.ip_risk_score),
        failed_logins_24h: Number(form.failed_logins_24h) || 0,
      });
      onCreated(res.transaction, res.contributions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score transaction');
    } finally {
      setBusy(false);
    }
  };

  const label = 'mb-1 block text-xs font-medium text-ink-2';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        data-lenis-prevent
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface"
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <h2 className="text-lg font-semibold">Score a new transaction</h2>
            <p className="text-xs text-muted">
              Velocity, spend ratio, account and device age are derived from the customer’s history.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5">
          <div>
            <label className={label}>Customer ID</label>
            <input required className={inputClass} value={form.customer_id} onChange={set('customer_id')} />
          </div>
          <div>
            <label className={label}>Amount (USD)</label>
            <input required type="number" min="0.01" step="0.01" className={inputClass} value={form.amount} onChange={set('amount')} />
          </div>
          <div>
            <label className={label}>Type</label>
            <select className={inputClass} value={form.type} onChange={set('type')}>
              {['PURCHASE', 'TRANSFER', 'WITHDRAWAL', 'DEPOSIT'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Merchant category</label>
            <select className={inputClass} value={form.merchant_category} onChange={set('merchant_category')}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Channel</label>
            <select className={inputClass} value={form.channel} onChange={set('channel')}>
              {['POS', 'WEB', 'MOBILE', 'ATM'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Country (ISO-2)</label>
            <input required maxLength={2} className={inputClass} value={form.country} onChange={set('country')} />
          </div>
          <div>
            <label className={label}>IP address</label>
            <input className={inputClass} placeholder="optional" value={form.ip_address} onChange={set('ip_address')} />
          </div>
          <div>
            <label className={label}>Device ID</label>
            <input className={inputClass} placeholder="blank = unknown device" value={form.device_id} onChange={set('device_id')} />
          </div>
          <div>
            <label className={label}>IP risk score (0–1)</label>
            <input type="number" min="0" max="1" step="0.01" className={inputClass} placeholder="auto" value={form.ip_risk_score} onChange={set('ip_risk_score')} />
          </div>
          <div>
            <label className={label}>Failed logins (24h)</label>
            <input type="number" min="0" className={inputClass} value={form.failed_logins_24h} onChange={set('failed_logins_24h')} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={form.is_vpn} onChange={set('is_vpn')} /> Connection via VPN / proxy
          </label>
        </div>
        {error && (
          <div className="px-5">
            <ErrorBanner message={error} />
          </div>
        )}
        <div className="p-5 pt-3">
          <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full justify-center py-2.5`}>
            {busy ? 'Scoring…' : 'Score & ingest'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <TransactionsView />
    </Suspense>
  );
}
