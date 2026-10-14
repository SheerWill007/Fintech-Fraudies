import type { TxStatus } from './api';

export function formatAmount(amount: number, compact = false): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount);
}

export function formatNumber(n: number, compact = false): string {
  return new Intl.NumberFormat('en-US', { notation: compact ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
}

export function formatPct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatDate(dateString: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(
    new Date(dateString),
  );
}

export function formatDay(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(dateString),
  );
}

export function formatRelativeTime(dateString: string | Date): string {
  const diffMins = Math.round((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} h ago`;
  return `${Math.round(diffHours / 24)} d ago`;
}

const ACRONYMS: Record<string, string> = { atm: 'ATM', p2p: 'P2P', vpn: 'VPN', ip: 'IP' };

export function humanize(key: string): string {
  return key
    .split('_')
    .map((w) => ACRONYMS[w.toLowerCase()] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getStatusBadgeClass(status: TxStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'text-good bg-good/10 border-good/25';
    case 'PENDING':
      return 'text-info bg-info/10 border-info/25';
    case 'FLAGGED':
      return 'text-warn bg-warn/10 border-warn/25';
    case 'BLOCKED':
      return 'text-bad bg-bad/10 border-bad/25';
    default:
      return 'text-muted bg-surface-2 border-line-strong';
  }
}

/** Risk score text colour (always shown next to the number itself). */
export function riskTextClass(score: number, thresholds?: { flag: number; review: number }): string {
  const flag = thresholds?.flag ?? 0.5;
  const review = thresholds?.review ?? 0.2;
  if (score >= flag) return 'text-bad';
  if (score >= review) return 'text-warn';
  return 'text-ink-2';
}
