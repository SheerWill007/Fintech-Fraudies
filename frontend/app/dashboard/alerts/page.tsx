'use client';

import { useEffect, useState } from 'react';
import { Transaction, fetchFlaggedTransactions } from '@/lib/api-client';
import TransactionCard from '@/components/TransactionCard/TransactionCard';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import gsap from 'gsap';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      const data = await fetchFlaggedTransactions();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    
    // Auto-refresh alerts every 10 seconds
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && alerts.length > 0) {
      gsap.fromTo(
        '.alert-item',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [loading, alerts]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold font-bold text-foreground">Alerts Queue</h1>
          <p className="text-foreground/60 mt-1">Review and manage high-risk transaction alerts.</p>
        </div>
        <button
          onClick={loadAlerts}
          disabled={loading}
          className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-foreground px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-lg animate-fade-in">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-card-border rounded-xl p-16 bg-card/20 text-center animate-fade-in">
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No active alerts</h3>
          <p className="text-sm text-foreground/50 mt-1 max-w-sm">
            All high-risk transactions are clear, and your systems are operating normally.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="alert-item">
              <TransactionCard transaction={alert} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
