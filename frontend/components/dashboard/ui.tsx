'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import type { TxStatus } from '@/lib/api';

/** Fetches on mount and whenever `deps` change; keeps the previous data while reloading. */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex max-w-[760px] flex-col gap-2">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="lede">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && <h3 className="panel-title">{title}</h3>}
            {subtitle && <p className="panel-sub">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Small area sparkline in the accent colour. */
export function Sparkline({ values, color = '#4ade80' }: { values: number[]; color?: string }) {
  const id = useId();
  if (values.length < 2) return null;
  const w = 84;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute bottom-3 right-3 h-[30px] w-[84px] opacity-90" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KpiTile({
  label,
  value,
  hint,
  delta,
  deltaGoodWhen = 'up',
  spark,
  sparkColor,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  deltaGoodWhen?: 'up' | 'down';
  spark?: number[];
  sparkColor?: string;
}) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const good = hasDelta && (deltaGoodWhen === 'up' ? delta! >= 0 : delta! <= 0);
  return (
    <div className="relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl border border-line bg-surface px-[18px] py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12.5px] font-medium text-muted">{label}</span>
        {hasDelta && (
          <span className={`delta ${good ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>
            {delta! >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(delta! * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <span className="whitespace-nowrap text-[26px] font-bold leading-[1.15] tracking-[-0.03em] tabular-nums">{value}</span>
      <span className={`min-h-[18px] truncate text-xs text-muted ${spark ? 'pr-24' : ''}`}>{hint}</span>
      {spark && <Sparkline values={spark} color={sparkColor} />}
    </div>
  );
}

const STATUS_STYLE: Record<TxStatus, { icon: typeof ShieldCheck; cls: string }> = {
  APPROVED: { icon: ShieldCheck, cls: 'text-good bg-good/10 border-good/25' },
  PENDING: { icon: Clock, cls: 'text-info bg-info/10 border-info/25' },
  FLAGGED: { icon: ShieldAlert, cls: 'text-warn bg-warn/10 border-warn/25' },
  BLOCKED: { icon: ShieldX, cls: 'text-bad bg-bad/10 border-bad/25' },
};

export function StatusBadge({ status }: { status: TxStatus }) {
  const { icon: Icon, cls } = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING;
  return (
    <span className={`tag ${cls}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {status}
    </span>
  );
}

export function LabelBadge({ isFraud }: { isFraud: boolean | null }) {
  if (isFraud === null) return <span className="text-xs text-faint">unlabelled</span>;
  return isFraud ? (
    <span className="text-xs font-semibold text-fraud">fraud</span>
  ) : (
    <span className="text-xs text-muted">legit</span>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-bad/35 bg-bad/10 px-4 py-3 text-[13.5px] text-bad">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-good/35 bg-good/10 px-4 py-3 text-[13.5px] text-good">{children}</div>;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-[13.5px] text-muted">
      <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-current border-r-transparent opacity-80" />
      {label}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-[22px] py-3.5 text-[13px] tabular-nums text-muted">
      <span>
        {total.toLocaleString()} result{total === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="mr-2">
          Page {page} of {pages}
        </span>
        <button className="icon-btn h-8 w-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="icon-btn h-8 w-8" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Filter pill: "Label  Value ⌄" around a native select (keyboard + screen-reader friendly). */
export function PillSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string | null;
}) {
  return (
    <label className={`pill-select ${value ? 'is-set' : ''}`}>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {allLabel !== null && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown />
    </label>
  );
}

export const inputClass = 'field';
export const buttonClass = 'btn-secondary';
export const primaryButtonClass = 'btn';
