'use client';

import { Transaction } from '@/lib/api-client';
import { formatAmount, formatDate, getStatusBadgeClass } from '@/lib/formatters';
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import RiskScoreMeter from '../RiskScoreMeter/RiskScoreMeter';

interface TransactionCardProps {
  transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const getIcon = () => {
    switch (transaction.status) {
      case 'APPROVED':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case 'PENDING':
        return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      case 'FLAGGED':
        return <ShieldX className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 relative overflow-hidden group">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-background border border-card-border`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {formatAmount(transaction.amount)}
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getStatusBadgeClass(transaction.status)}`}>
                  {transaction.status}
                </span>
              </h3>
              <p className="text-xs text-foreground/50">
                ID: {transaction.id} • {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-2 border-t border-b border-card-border/50">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Type</span>
              <span className="text-sm font-semibold text-foreground">{transaction.type}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">IP Address</span>
              <span className="text-sm font-semibold text-foreground">{transaction.ipAddress || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Device ID</span>
              <span className="text-sm font-semibold text-foreground truncate block max-w-[150px]">{transaction.deviceId || 'N/A'}</span>
            </div>
          </div>

          {transaction.riskFactors && transaction.riskFactors.length > 0 && (
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium mb-1.5">
                Risk Factors Detected
              </span>
              <div className="flex flex-wrap gap-2">
                {transaction.riskFactors.map((factor, idx) => (
                  <span key={idx} className="text-xs bg-red-500/10 text-red-400 border border-red-500/10 px-2.5 py-1 rounded">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {transaction.riskScore !== null && (
          <div className="flex items-center justify-center border-t md:border-t-0 md:border-l border-card-border/50 md:pl-6">
            <RiskScoreMeter score={transaction.riskScore} />
          </div>
        )}
      </div>
    </div>
  );
}
