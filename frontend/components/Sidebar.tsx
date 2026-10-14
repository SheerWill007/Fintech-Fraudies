'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Cpu,
  Database,
  FlaskConical,
  Gauge,
  Home,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from './dashboard/ui';

interface NavItem {
  name: string;
  href: string;
  icon: typeof Activity;
  badge?: 'alerts' | 'ML';
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Monitoring',
    items: [
      { name: 'Overview', href: '/dashboard', icon: BarChart3 },
      { name: 'Transactions', href: '/dashboard/transactions', icon: Activity },
      { name: 'Alerts', href: '/dashboard/alerts', icon: ShieldAlert, badge: 'alerts' },
    ],
  },
  {
    label: 'Machine learning',
    items: [
      { name: 'Model performance', href: '/dashboard/model', icon: Gauge },
      { name: 'Simulator', href: '/dashboard/simulator', icon: FlaskConical, badge: 'ML' },
    ],
  },
  {
    label: 'Data',
    items: [{ name: 'Data sources', href: '/dashboard/data', icon: Database }],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function openSearch() {
  window.dispatchEvent(new Event('fraudies:search'));
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const health = useApi(() => api.health(), []);
  const alerts = useApi(() => api.alerts({ view: 'open', page_size: 1 }), [pathname]);
  const model = useApi(() => api.model(), []);
  const ok = health.data?.status === 'ok';
  const openCount = alerts.data ? alerts.data.counts.flagged + alerts.data.counts.pending : null;

  // Ctrl/Cmd + K jumps to the global search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-background px-3 pb-3 pt-3.5 lg:flex">
      <Link href="/" className="flex min-h-12 items-center gap-2.5 rounded-[10px] px-2 py-1.5 hover:bg-white/[0.04]">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] border border-line bg-surface-3 text-accent">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <strong className="text-[14.5px] font-bold tracking-[-0.01em]">Fraudies</strong>
          <span className="truncate text-xs text-muted">Fraud ops · Production</span>
        </span>
      </Link>

      <button
        onClick={() => {
          if (!pathname.startsWith('/dashboard/transactions')) router.push('/dashboard/transactions');
          setTimeout(openSearch, 50);
        }}
        className="mb-[18px] mt-3 flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface pl-[11px] pr-2 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-ink-2"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <span className="ml-auto flex gap-[3px]">
          <kbd className="grid h-5 min-w-5 place-items-center rounded-[5px] border border-b-2 border-line-strong bg-surface-3 px-[5px] font-mono text-[11px] text-muted">
            Ctrl
          </kbd>
          <kbd className="grid h-5 min-w-5 place-items-center rounded-[5px] border border-b-2 border-line-strong bg-surface-3 px-[5px] font-mono text-[11px] text-muted">
            K
          </kbd>
        </span>
      </button>

      <nav className="flex flex-1 flex-col gap-[18px] overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <span className="whitespace-nowrap px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              {group.label}
            </span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex h-9 items-center gap-[11px] whitespace-nowrap rounded-[9px] px-2.5 font-medium transition-colors ${
                    active ? 'bg-surface-3 text-foreground' : 'text-muted hover:bg-white/[0.04] hover:text-foreground'
                  }`}
                >
                  {active && <span className="absolute -left-3 bottom-[9px] top-[9px] w-[3px] rounded-r-[3px] bg-accent" />}
                  <Icon className={`h-[17px] w-[17px] flex-none ${active ? 'text-accent' : ''}`} />
                  <span>{item.name}</span>
                  {item.badge === 'ML' && (
                    <span className="ml-auto rounded-[5px] bg-accent/[0.08] px-1.5 py-px text-[10.5px] font-bold text-accent">ML</span>
                  )}
                  {item.badge === 'alerts' && openCount !== null && openCount > 0 && (
                    <span className="ml-auto rounded-[5px] bg-warn/10 px-1.5 py-px text-[10.5px] font-bold tabular-nums text-warn">
                      {openCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <div className="grid gap-[7px] rounded-[10px] border border-line bg-surface px-[11px] py-2.5 text-xs">
          <div className="flex items-center gap-2 text-muted">
            <span
              className={`h-[7px] w-[7px] flex-none rounded-full ${
                health.loading
                  ? 'bg-faint'
                  : ok
                    ? 'bg-good shadow-[0_0_0_3px_rgba(74,222,128,0.1)]'
                    : 'bg-bad shadow-[0_0_0_3px_rgba(248,113,113,0.1)]'
              }`}
            />
            API
            <strong className="ml-auto font-semibold text-ink-2">
              {health.loading ? 'Connecting…' : ok ? 'Operational' : 'Unreachable'}
            </strong>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Cpu className="h-3.5 w-3.5" /> Model
            <strong className="ml-auto font-semibold text-ink-2">
              {model.data ? `PR-AUC ${model.data.metrics.test.pr_auc.toFixed(2)}` : '—'}
            </strong>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Database className="h-3.5 w-3.5" /> Rows
            <strong className="ml-auto font-semibold tabular-nums text-ink-2">
              {health.data ? health.data.rows.toLocaleString() : '—'}
            </strong>
          </div>
        </div>
        <Link href="/" className="icon-btn w-full border-transparent bg-transparent hover:bg-white/[0.04]" aria-label="Back to home">
          <Home className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}

