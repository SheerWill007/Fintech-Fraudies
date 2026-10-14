'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, Search } from 'lucide-react';
import { DOCS_URL } from '@/lib/api';
import { navItems } from './Sidebar';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = navItems.find((i) => i.href === pathname)?.name ?? 'Overview';

  useEffect(() => {
    const open = () => {
      setSearching(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    };
    window.addEventListener('fraudies:search', open);
    return () => window.removeEventListener('fraudies:search', open);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-md backdrop-saturate-150">
      <div className="flex h-14 items-center gap-3 px-4 md:px-7">
        <nav className="flex min-w-0 items-center gap-2 text-[13.5px] font-medium text-muted" aria-label="Breadcrumb">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-faint">/</span>
          <strong className="truncate font-semibold text-foreground">{current}</strong>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {searching ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) router.push(`/dashboard/transactions?search=${encodeURIComponent(q.trim())}`);
                setSearching(false);
              }}
            >
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onBlur={() => !q && setSearching(false)}
                onKeyDown={(e) => e.key === 'Escape' && setSearching(false)}
                placeholder="Transaction, customer, IP or device…"
                className="field h-[34px] w-56 md:w-72"
              />
            </form>
          ) : (
            <span className="hidden h-7 items-center gap-[7px] rounded-full border border-line bg-surface px-2.5 text-xs font-semibold text-ink-2 sm:inline-flex">
              <span className="h-[7px] w-[7px] rounded-full bg-good" /> Live
            </span>
          )}
          <button className="icon-btn" aria-label="Search" onClick={() => window.dispatchEvent(new Event('fraudies:search'))}>
            <Search className="h-4 w-4" />
          </button>
          <a href={DOCS_URL} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Open API docs" title="API docs">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      {/* Compact navigation below lg, where the sidebar is hidden */}
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
              pathname === item.href ? 'bg-surface-3 text-foreground' : 'text-muted'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
