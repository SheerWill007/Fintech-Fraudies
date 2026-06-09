'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Search, Filter, MoreVertical, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { fetchTransactions } from '@/lib/api';

// Mock initial data as fallback
const initialTransactions = [
  { id: 'TX-9821', amount: 1250.00, status: 'completed', date: '2026-05-14T08:15:00', merchant: 'Apple Store', type: 'debit' },
  { id: 'TX-9822', amount: 45.00, status: 'pending', date: '2026-05-14T08:12:00', merchant: 'Starbucks', type: 'debit' },
  { id: 'TX-9823', amount: 5000.00, status: 'flagged', date: '2026-05-14T08:05:00', merchant: 'Unknown Crypto Ex', type: 'debit' },
  { id: 'TX-9824', amount: 3200.50, status: 'completed', date: '2026-05-14T07:45:00', merchant: 'Salary Deposit', type: 'credit' },
  { id: 'TX-9825', amount: 120.99, status: 'completed', date: '2026-05-14T07:30:00', merchant: 'Amazon', type: 'debit' },
  { id: 'TX-9826', amount: 15.50, status: 'failed', date: '2026-05-14T07:15:00', merchant: 'Netflix', type: 'debit' },
];

export default function TransactionsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load animation and data fetching
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchTransactions();
        setTransactions(data.length > 0 ? data : initialTransactions);
      } catch (error) {
        console.error('Failed to fetch transactions, using mock data:', error);
        setTransactions(initialTransactions);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.header-elem', { y: -20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
      gsap.from('.tx-row', { x: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Real-time simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const newTx = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: parseFloat((Math.random() * 500).toFixed(2)),
        status: Math.random() > 0.8 ? 'flagged' : (Math.random() > 0.6 ? 'pending' : 'completed'),
        date: new Date().toISOString(),
        merchant: ['Uber', 'Lyft', 'Whole Foods', 'Steam', 'Spotify', 'Target'][Math.floor(Math.random() * 6)],
        type: Math.random() > 0.9 ? 'credit' : 'debit'
      };

      setTransactions(prev => [newTx, ...prev].slice(0, 15)); // Keep last 15
      
      // Animate new item
      setTimeout(() => {
        if (listRef.current && listRef.current.firstChild) {
          gsap.fromTo(listRef.current.firstChild as Element, 
            { height: 0, opacity: 0, backgroundColor: 'rgba(16, 185, 129, 0.2)' },
            { height: 'auto', opacity: 1, backgroundColor: 'transparent', duration: 0.5, ease: 'power2.out' }
          );
        }
      }, 0);

    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'flagged': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'failed': return 'bg-foreground/10 text-foreground/70 border-card-border';
      default: return 'bg-foreground/10 text-foreground border-card-border';
    }
  };

  const formatCurrency = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    return type === 'credit' ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 header-elem">
        <div>
          <h1 className="text-3xl font-semibold font-bold text-foreground">Real-time Transactions</h1>
          <p className="text-foreground/60 mt-1">Live feed of all system transactions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSimulating ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Stop Live Feed' : 'Start Live Feed'}
          </button>
          <div className="flex items-center gap-2 bg-card border border-card-border rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-foreground/50" />
            <span className="text-sm font-medium text-foreground">Filter</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden header-elem">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-card-border bg-background/50 text-xs font-medium text-foreground/50 uppercase tracking-wider">
          <div className="col-span-3">Transaction ID</div>
          <div className="col-span-3">Merchant</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2 text-center">Status</div>
        </div>
        
        <div ref={listRef} className="divide-y divide-card-border">
          {isLoading ? (
            <div className="p-8 text-center text-foreground/50">Loading transactions...</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="tx-row grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group cursor-pointer overflow-hidden">
                <div className="col-span-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-primary/10' : 'bg-background'}`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownRight className="w-4 h-4 text-primary" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-foreground/70" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground font-mono">{tx.id}</span>
                </div>
                
                <div className="col-span-3 flex items-center">
                  <span className="text-sm text-foreground">{tx.merchant || 'Unknown Merchant'}</span>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-foreground/60">{formatDate(tx.date || tx.createdAt)}</span>
                </div>
                
                <div className="col-span-2 flex items-center justify-end">
                  <span className={`text-sm font-medium font-mono ${tx.type === 'credit' ? 'text-primary' : 'text-foreground'}`}>
                    {formatCurrency(tx.amount, tx.type)}
                  </span>
                </div>
                
                <div className="col-span-2 flex items-center justify-between">
                  <div className="flex-1 flex justify-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(tx.status.toLowerCase())} capitalize`}>
                      {tx.status}
                    </span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-foreground/50 hover:text-foreground transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
          {!isLoading && transactions.length === 0 && (
             <div className="p-8 text-center text-foreground/50">No transactions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
