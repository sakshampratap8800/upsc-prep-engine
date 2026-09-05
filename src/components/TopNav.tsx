'use client';

import React from 'react';
import { Menu, X, BookOpen, Calendar, Search } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';

export function TopNav() {
  const { isOpen, toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur transition-colors">
      <div className="flex items-center gap-3">
        {/* Hamburger Toggle */}
        <button
          onClick={toggle}
          aria-label={isOpen ? 'Close Sidebar' : 'Open Sidebar'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-stone-900">
            UPSC Prep Engine
          </span>
          <span className="hidden sm:inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
            CSE 2027
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/timetable"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
        >
          <Calendar className="h-3.5 w-3.5 text-stone-500" />
          <span>Timetable</span>
        </Link>
        <Link
          href="/library"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
        >
          <BookOpen className="h-3.5 w-3.5 text-stone-500" />
          <span>Library</span>
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-1.5 rounded-lg bg-stone-100 p-2 text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
