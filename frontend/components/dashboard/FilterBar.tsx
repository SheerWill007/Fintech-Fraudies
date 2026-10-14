'use client';

import { ArrowRight } from 'lucide-react';
import type { DashboardFilters, FilterOptions } from '@/lib/api';
import { humanize } from '@/lib/formatters';
import { PillSelect } from './ui';

export type FilterState = DashboardFilters & { range: number };

const RANGES = [
  { label: 'All time', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function shiftDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days + 1);
  return d.toISOString().slice(0, 10);
}

/** One row of filters above the content; every chart and KPI below is scoped by it. */
export default function FilterBar({
  options,
  value,
  onChange,
}: {
  options: FilterOptions | null;
  value: FilterState;
  onChange: (v: FilterState) => void;
}) {
  const single = (key: 'type' | 'channel' | 'category') => (v: string) => onChange({ ...value, [key]: v ? [v] : undefined });
  const active = Boolean(value.start || value.end || value.type || value.channel || value.category);

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2">
      <div className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-line bg-surface-2 pl-3 pr-1.5">
        <span className="text-[12.5px] font-medium text-muted">Date</span>
        <input
          type="date"
          aria-label="From date"
          value={value.start ?? ''}
          min={options?.min_date}
          max={options?.max_date}
          onChange={(e) => onChange({ ...value, range: -1, start: e.target.value || undefined })}
          className="w-[128px] rounded-md bg-transparent p-1 text-[13px] tabular-nums text-foreground [color-scheme:dark] focus:outline-none"
        />
        <ArrowRight className="h-3.5 w-3.5 text-faint" />
        <input
          type="date"
          aria-label="To date"
          value={value.end ?? ''}
          min={options?.min_date}
          max={options?.max_date}
          onChange={(e) => onChange({ ...value, range: -1, end: e.target.value || undefined })}
          className="w-[128px] rounded-md bg-transparent p-1 text-[13px] tabular-nums text-foreground [color-scheme:dark] focus:outline-none"
        />
      </div>
      <PillSelect
        label="Period"
        allLabel={value.range === -1 ? 'Custom' : 'All time'}
        value={value.range > 0 ? String(value.range) : ''}
        onChange={(v) => {
          const days = Number(v);
          onChange({ ...value, range: days, start: days && options ? shiftDays(options.max_date, days) : undefined, end: undefined });
        }}
        options={RANGES.filter((r) => r.days > 0).map((r) => ({ value: String(r.days), label: r.label }))}
      />
      <PillSelect
        label="Type"
        value={value.type?.[0] ?? ''}
        onChange={single('type')}
        options={(options?.types ?? []).map((t) => ({ value: t, label: humanize(t.toLowerCase()) }))}
      />
      <PillSelect
        label="Channel"
        value={value.channel?.[0] ?? ''}
        onChange={single('channel')}
        options={(options?.channels ?? []).map((c) => ({ value: c, label: c }))}
      />
      <PillSelect
        label="Category"
        value={value.category?.[0] ?? ''}
        onChange={single('category')}
        options={(options?.categories ?? []).map((c) => ({ value: c, label: humanize(c) }))}
      />
      <span className="flex-1" />
      {active && (
        <button className="btn-secondary btn-sm border-transparent bg-transparent text-muted" onClick={() => onChange({ range: 0 })}>
          Clear filters
        </button>
      )}
    </div>
  );
}
