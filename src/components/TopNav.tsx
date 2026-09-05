'use client';

import React from 'react';
import { Menu, X, BookOpen, Calendar, Search, Sun, Moon } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export function TopNav() {
  const { isOpen, toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 px-4 backdrop-blur transition-colors">
      <div className="flex items-center gap-3">
        {/* Hamburger Toggle */}
        <button
          onClick={toggle}
          aria-label={isOpen ? 'Close Sidebar' : 'Open Sidebar'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100 hover:opacity-80 transition">
            UPSC Prep Engine
          </Link>
          <span className="hidden sm:inline-block rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:text-stone-300">
            CSE 2027
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/syllabus"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          <span>Syllabus</span>
        </Link>
        <Link
          href="/timetable"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          <Calendar className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
          <span>Timetable</span>
        </Link>
        <Link
          href="/library"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          <BookOpen className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
          <span>Library</span>
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 transition"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </Link>

        {/* Dark Mode Switch */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-stone-600 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </header>
  );
}
