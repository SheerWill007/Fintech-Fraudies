'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Activity } from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Transactions', href: '/dashboard/transactions', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-card border-r border-card-border flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-black">
            f
          </span>
          <span className="font-semibold text-xl text-foreground">Fora.</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-card-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">John Doe</span>
            <span className="text-xs text-foreground/50">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
