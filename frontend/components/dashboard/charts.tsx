'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BreakdownRow, CurvePoint, HourRow, RiskBin, TimePoint } from '@/lib/api';
import { formatAmount, formatDay, formatNumber, formatPct, humanize } from '@/lib/formatters';

// Series colours (validated for colour-vision deficiency on the #0f0f0f surface):
// legit = blue, fraud = yellow; single-series trends use the green brand accent.
export const ACCENT = '#4ade80';
export const LEGIT = '#3b82f6';
export const FRAUD = '#eab308';
// Fixed entity -> colour mapping so a model keeps its colour whatever the ranking.
export const MODEL_COLORS: Record<string, string> = {
  'Logistic Regression': '#9085e9',
  'Random Forest': '#eab308',
  HistGradientBoosting: '#3b82f6',
  XGBoost: '#d55181',
  LightGBM: '#4ade80',
};

const GRID = 'rgba(255,255,255,0.06)';
const LABEL = 'rgba(255,255,255,0.78)';
const AXIS = { fill: 'rgba(255,255,255,0.45)', fontSize: 11.5 };
const AXIS_PROPS = { tick: AXIS, tickLine: false, axisLine: { stroke: 'rgba(255,255,255,0.1)' } } as const;
const CURSOR_LINE = { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 };
const CURSOR_BAR = { fill: 'rgba(255,255,255,0.04)' };

interface TooltipRow {
  name: string;
  value: string;
  color: string;
}

function TooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-[168px] rounded-[10px] bg-surface-2 px-3 py-2.5 text-[12.5px] shadow-pop">
      <div className="mb-1.5 font-semibold">{title}</div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2 leading-[1.75]">
          <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: r.color }} />
          <span className="text-muted">{r.name}</span>
          <span className="ml-auto pl-3.5 font-semibold tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TP = { active?: boolean; payload?: any[]; label?: any };

function ChartFrame({ height = 240, children }: { height?: number; children: React.ReactElement }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export type TrendMetric = 'volume' | 'transactions' | 'fraud';

/** Performance trend: volume / transactions as a green area, fraud cases as yellow bars. */
export function TrendChart({ data, metric }: { data: TimePoint[]; metric: TrendMetric }) {
  const tooltip = ({ active, payload, label }: TP) =>
    active && payload?.length ? (
      <TooltipBox
        title={formatDay(label)}
        rows={[
          { name: 'Volume', value: formatAmount(payload[0].payload.volume), color: ACCENT },
          { name: 'Transactions', value: formatNumber(payload[0].payload.transactions), color: ACCENT },
          { name: 'Fraud cases', value: String(payload[0].payload.fraud), color: FRAUD },
          { name: 'Fraud rate', value: formatPct(payload[0].payload.fraud_rate, 2), color: FRAUD },
        ]}
      />
    ) : null;

  if (metric === 'fraud') {
    return (
      <ChartFrame height={300}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={40} {...AXIS_PROPS} />
          <YAxis allowDecimals={false} width={40} {...AXIS_PROPS} axisLine={false} />
          <Tooltip cursor={CURSOR_BAR} content={tooltip} />
          <Bar dataKey="fraud" fill={FRAUD} radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ChartFrame>
    );
  }
  const key = metric === 'volume' ? 'volume' : 'transactions';
  return (
    <ChartFrame height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatDay} minTickGap={40} {...AXIS_PROPS} />
        <YAxis
          tickFormatter={(v) => (metric === 'volume' ? formatAmount(v, true) : formatNumber(v, true))}
          width={60}
          {...AXIS_PROPS}
          axisLine={false}
        />
        <Tooltip cursor={CURSOR_LINE} content={tooltip} />
        <Area type="monotone" dataKey={key} stroke={ACCENT} strokeWidth={2} fill="url(#trend-fill)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ChartFrame>
  );
}

/** Horizontal bars: fraud rate per category, sorted, with the value direct-labelled. */
export function FraudRateBars({ data, height }: { data: BreakdownRow[]; height?: number }) {
  const rows = [...data].sort((a, b) => b.fraud_rate - a.fraud_rate);
  return (
    <ChartFrame height={height ?? Math.max(160, rows.length * 26 + 20)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatPct(v, 0)} {...AXIS_PROPS} />
        <YAxis type="category" dataKey="key" width={96} tickFormatter={humanize} {...AXIS_PROPS} axisLine={false} />
        <Tooltip
          cursor={CURSOR_BAR}
          content={({ active, payload }: TP) =>
            active && payload?.length ? (
              <TooltipBox
                title={humanize(payload[0].payload.key)}
                rows={[
                  { name: 'Fraud rate', value: formatPct(payload[0].payload.fraud_rate, 2), color: FRAUD },
                  { name: 'Fraud cases', value: formatNumber(payload[0].payload.fraud), color: FRAUD },
                  { name: 'Transactions', value: formatNumber(payload[0].payload.transactions), color: LEGIT },
                  { name: 'Volume', value: formatAmount(payload[0].payload.volume, true), color: LEGIT },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="fraud_rate"
          fill={FRAUD}
          radius={[0, 4, 4, 0]}
          maxBarSize={16}
          label={{ position: 'right', fill: LABEL, fontSize: 11, formatter: (v: number) => formatPct(v, 1) }}
        />
      </BarChart>
    </ChartFrame>
  );
}

/** Fraud rate by hour of day (UTC). */
export function HourlyChart({ data }: { data: HourRow[] }) {
  return (
    <ChartFrame height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="hour" tickFormatter={(h) => `${String(h).padStart(2, '0')}h`} interval={2} {...AXIS_PROPS} />
        <YAxis tickFormatter={(v) => formatPct(v, 0)} width={40} {...AXIS_PROPS} axisLine={false} />
        <Tooltip
          cursor={CURSOR_BAR}
          content={({ active, payload }: TP) =>
            active && payload?.length ? (
              <TooltipBox
                title={`${String(payload[0].payload.hour).padStart(2, '0')}:00–${String(payload[0].payload.hour).padStart(2, '0')}:59 UTC`}
                rows={[
                  { name: 'Fraud rate', value: formatPct(payload[0].payload.fraud_rate, 2), color: FRAUD },
                  { name: 'Fraud cases', value: String(payload[0].payload.fraud), color: FRAUD },
                  { name: 'Transactions', value: formatNumber(payload[0].payload.transactions), color: LEGIT },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="fraud_rate" fill={FRAUD} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

/**
 * Risk-score distribution, each class normalised to its own total so a 3% minority
 * class is as readable as the majority on one shared axis.
 */
export function RiskDistributionChart({ data, flag }: { data: RiskBin[]; flag?: number }) {
  const legitTotal = data.reduce((s, b) => s + b.legit, 0) || 1;
  const fraudTotal = data.reduce((s, b) => s + b.fraud, 0) || 1;
  const rows = data.map((b) => ({ ...b, legitShare: b.legit / legitTotal, fraudShare: b.fraud / fraudTotal }));
  const flagBin = flag !== undefined ? rows[Math.min(rows.length - 1, Math.floor(flag * rows.length))]?.bin : undefined;
  return (
    <ChartFrame height={240}>
      <BarChart data={rows} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap={3}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="bin" interval={3} {...AXIS_PROPS} />
        <YAxis tickFormatter={(v) => formatPct(v, 0)} width={40} {...AXIS_PROPS} axisLine={false} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', paddingBottom: 8 }}
        />
        {flagBin && (
          <ReferenceLine
            x={flagBin}
            stroke="rgba(255,255,255,0.4)"
            strokeDasharray="3 3"
            label={{ value: 'flag threshold', position: 'top', fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
          />
        )}
        <Tooltip
          cursor={CURSOR_BAR}
          content={({ active, payload }: TP) =>
            active && payload?.length ? (
              <TooltipBox
                title={`Risk score ${payload[0].payload.label}`}
                rows={[
                  {
                    name: 'Legit',
                    value: `${formatPct(payload[0].payload.legitShare)} (${formatNumber(payload[0].payload.legit)})`,
                    color: LEGIT,
                  },
                  {
                    name: 'Fraud',
                    value: `${formatPct(payload[0].payload.fraudShare)} (${formatNumber(payload[0].payload.fraud)})`,
                    color: FRAUD,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar name="Legit (% of legit)" dataKey="legitShare" fill={LEGIT} radius={[4, 4, 0, 0]} />
        <Bar name="Fraud (% of fraud)" dataKey="fraudShare" fill={FRAUD} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

/** ROC curves for every benchmarked model on the out-of-time test set. */
export function RocChart({ curves, highlight }: { curves: Record<string, CurvePoint[]>; highlight: string }) {
  const names = Object.keys(MODEL_COLORS).filter((n) => curves[n]);
  return (
    <ChartFrame height={300}>
      <LineChart margin={{ top: 8, right: 12, left: 0, bottom: 16 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, 0.2]}
          allowDataOverflow
          ticks={[0, 0.05, 0.1, 0.15, 0.2]}
          tickFormatter={(v) => v.toFixed(2)}
          label={{ value: 'False positive rate (zoomed to ≤ 0.2)', position: 'insideBottom', offset: -8, fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
          {...AXIS_PROPS}
        />
        <YAxis type="number" dataKey="y" domain={[0.5, 1]} allowDataOverflow tickFormatter={(v) => v.toFixed(1)} width={32} {...AXIS_PROPS} />
        <ReferenceLine
          ifOverflow="hidden"
          segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="4 4"
        />
        <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
        <Tooltip
          cursor={CURSOR_LINE}
          content={({ active, payload }: TP) =>
            active && payload?.length ? (
              <TooltipBox
                title={`FPR ${Number(payload[0].payload.x).toFixed(3)}`}
                rows={payload.map((p) => ({ name: p.name, value: `TPR ${Number(p.payload.y).toFixed(3)}`, color: p.color }))}
              />
            ) : null
          }
        />
        {names.map((n) => (
          <Line
            key={n}
            name={n}
            data={curves[n]}
            dataKey="y"
            type="linear"
            stroke={MODEL_COLORS[n]}
            strokeWidth={n === highlight ? 2.5 : 1.5}
            strokeOpacity={n === highlight ? 1 : 0.7}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartFrame>
  );
}

/** Precision-recall curve for the selected model. */
export function PrChart({ curve, color }: { curve: CurvePoint[]; color: string }) {
  return (
    <ChartFrame height={300}>
      <AreaChart data={curve} margin={{ top: 8, right: 12, left: 0, bottom: 16 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, 1]}
          tickFormatter={(v) => v.toFixed(1)}
          label={{ value: 'Recall', position: 'insideBottom', offset: -8, fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
          {...AXIS_PROPS}
        />
        <YAxis domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} width={32} {...AXIS_PROPS} />
        <Tooltip
          cursor={CURSOR_LINE}
          content={({ active, payload }: TP) =>
            active && payload?.length ? (
              <TooltipBox
                title={`Recall ${Number(payload[0].payload.x).toFixed(3)}`}
                rows={[{ name: 'Precision', value: Number(payload[0].payload.y).toFixed(3), color }]}
              />
            ) : null
          }
        />
        <Area type="stepAfter" dataKey="y" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.12} dot={false} />
      </AreaChart>
    </ChartFrame>
  );
}

/** Horizontal bars: share of model attribution (mean |SHAP|) per feature group. */
export function ImportanceChart({ data, color }: { data: { feature: string; importance: number }[]; color: string }) {
  return (
    <ChartFrame height={data.length * 26 + 20}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatPct(v, 0)} {...AXIS_PROPS} />
        <YAxis type="category" dataKey="feature" width={130} tickFormatter={humanize} {...AXIS_PROPS} axisLine={false} />
        <Tooltip
          cursor={CURSOR_BAR}
          content={({ active, payload }: TP) =>
            active && payload?.length ? (
              <TooltipBox
                title={humanize(payload[0].payload.feature)}
                rows={[{ name: 'Share of attribution', value: formatPct(payload[0].payload.importance), color }]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="importance"
          fill={color}
          radius={[0, 4, 4, 0]}
          maxBarSize={16}
          label={{ position: 'right', fill: LABEL, fontSize: 11, formatter: (v: number) => formatPct(v, 1) }}
        />
      </BarChart>
    </ChartFrame>
  );
}

/** Diverging bars: per-feature contribution to one prediction (log-odds). */
export function ContributionChart({ data }: { data: { label: string; contribution: number }[] }) {
  const rows = data.slice(0, 8);
  return (
    <ChartFrame height={rows.length * 30 + 16}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v) => v.toFixed(1)} />
        <YAxis type="category" dataKey="label" width={210} {...AXIS_PROPS} axisLine={false} tick={{ ...AXIS, fontSize: 10.5 }} />
        <ReferenceLine x={0} stroke="rgba(255,255,255,0.3)" />
        <Tooltip
          cursor={CURSOR_BAR}
          content={({ active, payload }: TP) =>
            active && payload?.length ? (
              <TooltipBox
                title={payload[0].payload.label}
                rows={[
                  {
                    name: payload[0].payload.contribution >= 0 ? 'Raises risk' : 'Lowers risk',
                    value: `${payload[0].payload.contribution >= 0 ? '+' : ''}${payload[0].payload.contribution.toFixed(2)} log-odds`,
                    color: payload[0].payload.contribution >= 0 ? FRAUD : LEGIT,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="contribution" radius={4} maxBarSize={14}>
          {rows.map((r) => (
            <Cell key={r.label} fill={r.contribution >= 0 ? FRAUD : LEGIT} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
