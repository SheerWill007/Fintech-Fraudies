'use client';

import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 border-b border-card-border bg-background/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search transactions, customers, or alerts..."
            className="w-full bg-card/50 border border-card-border rounded-full py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2 text-foreground/70 hover:text-foreground hover:bg-white/5 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
        </button>
      </div>
    </header>
  );
}
