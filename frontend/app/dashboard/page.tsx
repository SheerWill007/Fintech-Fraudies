'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Activity, ShieldAlert, CreditCard, DollarSign } from 'lucide-react';
export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.stat-card', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
      });

      gsap.from('.recent-section', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        delay: 0.3,
        ease: 'power2.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { label: 'Total Volume', value: '$2.4M', icon: DollarSign, trend: '+12.5%', color: 'text-primary' },
    { label: 'Active Cards', value: '45,231', icon: CreditCard, trend: '+3.2%', color: 'text-accent' },
    { label: 'Transactions', value: '1,234,567', icon: Activity, trend: '+15.4%', color: 'text-blue-500' },
    { label: 'Fraud Alerts', value: '23', icon: ShieldAlert, trend: '-2.1%', color: 'text-red-500' },
  ];

  return (
    <div ref={containerRef} className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold font-bold text-foreground">Overview</h1>
        <p className="text-foreground/60 mt-1">Monitor your real-time financial metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith('+');
          
          return (
            <div key={stat.label} className="stat-card bg-card border border-card-border rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg bg-background ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-sm font-medium ${isPositive ? 'text-primary' : 'text-red-500'}`}>
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-3xl font-semibold font-bold text-foreground mb-1">{stat.value}</h3>
              <p className="text-sm text-foreground/60">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="recent-section grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold font-bold text-foreground">Transaction Activity</h2>
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-card-border rounded-lg bg-background/50">
            <span className="text-foreground/40 text-sm">Chart Placeholder</span>
          </div>
        </div>
        
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold font-bold text-foreground">Recent Alerts</h2>
            <span className="text-sm text-zinc-500">Recent</span>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-background border border-card-border">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Suspicious login attempt</p>
                  <p className="text-xs text-foreground/50">2 mins ago • IP: 192.168.1.1</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
