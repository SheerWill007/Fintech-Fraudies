'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Search, Filter, ArrowUpRight, Plus, RefreshCw, X } from 'lucide-react';
import { fetchTransactions, createTransaction, Transaction } from '@/lib/api-client';
import { formatAmount, formatDate, getStatusBadgeClass } from '@/lib/formatters';

const initialTransactions: Transaction[] = [
  { 
    id: 'TX-9821', 
    userId: 'user1',
    amount: 9500.00, 
    type: 'TRANSFER', 
    status: 'FLAGGED', 
    riskScore: 0.85, 
    riskFactors: ['Large transaction amount ($9,500.00)', 'High-risk transaction type (TRANSFER)'], 
    ipAddress: '185.220.101.5', 
    deviceId: 'new_device_001', 
    createdAt: new Date(Date.now() - 300000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
  },
  { 
    id: 'TX-9822', 
    userId: 'user1',
    amount: 120.00, 
    type: 'PURCHASE', 
    status: 'APPROVED', 
    riskScore: 0.10, 
    riskFactors: [], 
    ipAddress: '192.168.1.5', 
    deviceId: 'device_998', 
    createdAt: new Date(Date.now() - 600000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
  },
  { 
    id: 'TX-9823', 
    userId: 'user1',
    amount: 450.00, 
    type: 'WITHDRAWAL', 
    status: 'PENDING', 
    riskScore: 0.45, 
    riskFactors: ['High-risk transaction type (WITHDRAWAL)'], 
    ipAddress: '24.108.92.11', 
    deviceId: 'device_342', 
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
];

export default function TransactionsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Transaction Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('PURCHASE');
  const [ipAddress, setIpAddress] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchTransactions();
      setTransactions(data.length > 0 ? data : initialTransactions);
    } catch (err) {
      console.warn('API error, using initial mock dataset:', err);
      setTransactions(initialTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.header-elem', { y: -20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
      gsap.from('.tx-row', { x: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const newTx = await createTransaction({
        amount: parseFloat(amount),
        type,
        ipAddress: ipAddress || undefined,
        deviceId: deviceId || undefined,
      });

      setTransactions((prev) => [newTx, ...prev]);
      setIsModalOpen(false);
      
      // Reset form
      setAmount('');
      setType('PURCHASE');
      setIpAddress('');
      setDeviceId('');
      
      // Trigger short highlighting/stagger animation on first row
      setTimeout(() => {
        gsap.fromTo(
          '.tx-row:first-child',
          { backgroundColor: 'rgba(var(--primary-rgb), 0.2)' },
          { backgroundColor: 'transparent', duration: 0.8, ease: 'power2.out' }
        );
      }, 50);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 header-elem">
        <div>
          <h1 className="text-3xl font-semibold font-bold text-foreground">Transactions Feed</h1>
          <p className="text-foreground/60 mt-1">Live overview and monitoring of platform transactions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2.5 rounded-lg font-medium transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Create Transaction
          </button>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-foreground px-3 py-2.5 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden header-elem">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-card-border bg-background/50 text-xs font-medium text-foreground/50 uppercase tracking-wider">
          <div className="col-span-3">Transaction ID / Type</div>
          <div className="col-span-3">Context (IP / Device)</div>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-center">Risk Score</div>
          <div className="col-span-1 text-center">Status</div>
        </div>
        
        <div className="divide-y divide-card-border">
          {isLoading ? (
            <div className="p-8 text-center text-foreground/50">Loading transactions...</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="tx-row grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group cursor-pointer overflow-hidden">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-background border border-card-border">
                    <ArrowUpRight className="w-4 h-4 text-foreground/70" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground font-mono block">{tx.id}</span>
                    <span className="text-[10px] text-zinc-500 font-bold block">{tx.type}</span>
                  </div>
                </div>
                
                <div className="col-span-3">
                  <span className="text-sm text-foreground block font-medium">{tx.ipAddress || 'No IP'}</span>
                  <span className="text-xs text-foreground/50 truncate block max-w-[180px]">{tx.deviceId || 'No Device ID'}</span>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-foreground/60">{formatDate(tx.createdAt)}</span>
                </div>
                
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-sm font-semibold font-mono text-foreground">
                    {formatAmount(tx.amount)}
                  </span>
                </div>

                <div className="col-span-1 text-center">
                  {tx.riskScore !== null ? (
                    <span className={`text-sm font-bold font-mono ${tx.riskScore >= 0.7 ? 'text-red-500' : tx.riskScore >= 0.4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {Math.round(tx.riskScore * 100)}%
                    </span>
                  ) : (
                    <span className="text-sm text-foreground/30 font-medium font-mono">—</span>
                  )}
                </div>
                
                <div className="col-span-1 flex items-center justify-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
          {!isLoading && transactions.length === 0 && (
             <div className="p-8 text-center text-foreground/50">No transactions found.</div>
          )}
        </div>
      </div>

      {/* Ingest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-card-border">
              <h2 className="text-xl font-bold text-foreground">Ingest Transaction</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/85 mb-1.5" htmlFor="tx-amount">
                  Amount (USD)
                </label>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="500.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/85 mb-1.5" htmlFor="tx-type">
                  Transaction Type
                </label>
                <select
                  id="tx-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="PURCHASE">PURCHASE</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="WITHDRAWAL">WITHDRAWAL</option>
                  <option value="DEPOSIT">DEPOSIT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/85 mb-1.5" htmlFor="tx-ip">
                  IP Address (Optional)
                </label>
                <input
                  id="tx-ip"
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="192.168.1.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/85 mb-1.5" htmlFor="tx-device">
                  Device ID (Optional)
                </label>
                <input
                  id="tx-device"
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="device_abc123"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 focus:outline-none transition-all disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Scoring & Ingesting...' : 'Submit Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
