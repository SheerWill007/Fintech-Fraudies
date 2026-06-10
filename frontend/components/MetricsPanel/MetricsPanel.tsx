'use client';

import { DashboardStats } from '@/lib/api-client';
import { formatAmount } from '@/lib/formatters';
import { Activity, ShieldAlert, DollarSign, Percent } from 'lucide-react';

interface MetricsPanelProps {
  stats: DashboardStats;
}

export default function MetricsPanel({ stats }: MetricsPanelProps) {
  const cards = [
    {
      label: 'Total Volume',
      value: formatAmount(stats.totalVolume),
      icon: DollarSign,
      color: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      label: 'Total Transactions',
      value: stats.transactionCount.toLocaleString(),
      icon: Activity,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Flagged Alerts',
      value: stats.flaggedCount.toLocaleString(),
      icon: ShieldAlert,
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Approval Rate',
      value: `${stats.approvalRate}%`,
      icon: Percent,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="stat-card bg-card border border-card-border rounded-xl p-6 relative overflow-hidden group animate-fade-in"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg border ${card.color.split(' ').slice(1).join(' ')}`}>
                <Icon className={`w-6 h-6 ${card.color.split(' ')[0]}`} />
              </div>
            </div>
            <h3 className="text-3xl font-semibold font-bold text-foreground mb-1">
              {card.value}
            </h3>
            <p className="text-sm text-foreground/60">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
