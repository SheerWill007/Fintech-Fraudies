'use client';

import { useEffect, useState } from 'react';
import { getStats, fetchFlaggedTransactions, DashboardStats, Transaction } from '@/lib/api-client';
import MetricsPanel from '@/components/MetricsPanel/MetricsPanel';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDate, formatAmount } from '@/lib/formatters';
import Link from 'next/link';
import gsap from 'gsap';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [statsData, alertsData] = await Promise.all([
        getStats(),
        fetchFlaggedTransactions()
      ]);
      setStats(statsData);
      setRecentAlerts(alertsData.slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        '.dashboard-animate',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center dashboard-animate">
        <div>
          <h1 className="text-3xl font-semibold font-bold text-foreground">Overview</h1>
          <p className="text-foreground/60 mt-1">Real-time financial metrics and transaction risk monitoring.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-foreground px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-lg dashboard-animate">
          {error}
        </div>
      )}

      {stats && (
        <div className="dashboard-animate">
          <MetricsPanel stats={stats} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dashboard-animate">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6 flex flex-col justify-between">
          <div className="mb-6">
            <h2 className="text-xl font-semibold font-bold text-foreground">Transaction Activity</h2>
            <p className="text-xs text-foreground/50 mt-1">Daily volume distribution model.</p>
          </div>
          
          <div className="h-64 flex items-end justify-between px-2 pt-6 border-b border-l border-card-border/50">
            {[40, 25, 60, 45, 80, 55, 90, 70, 85, 65, 75, 95].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end px-1.5">
                <div 
                  className="w-full bg-primary/20 group-hover:bg-primary border border-primary/25 rounded-t transition-all duration-300 relative"
                  style={{ height: `${val}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-card-border text-[10px] text-white px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                    {formatAmount(val * 1200)}
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 mt-2">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold font-bold text-foreground">Recent Alerts</h2>
            <Link href="/dashboard/alerts" className="text-sm text-primary hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-foreground/40">
                <ShieldAlert className="w-8 h-8 mb-2 text-zinc-600" />
                <span className="text-sm">No active alerts</span>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-4 p-3 rounded-lg bg-background border border-card-border group hover:border-card-border/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {formatAmount(alert.amount)} - {alert.type}
                    </p>
                    <p className="text-xs text-foreground/50 truncate">
                      {formatDate(alert.createdAt)} • Risk: {Math.round((alert.riskScore || 0) * 100)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
