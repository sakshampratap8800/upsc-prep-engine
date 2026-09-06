'use client';

import Link from 'next/link';
import { BookOpen, FileQuestion, Sparkles, ChevronRight } from 'lucide-react';

interface ChapterCardProps {
  id: number;
  number: number;
  title: string;
  bookId: number;
  subjectSlug: string;
  pyqCount: number;
  hasAnalysis?: boolean;
}

export function ChapterCard({
  id,
  number,
  title,
  bookId,
  subjectSlug,
  pyqCount,
  hasAnalysis = false,
}: ChapterCardProps) {
  return (
    <Link href={`/library/${subjectSlug}/${bookId}/${id}`} className="block group">
      <div className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-all duration-200 hover:border-stone-400 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60 shadow-xs">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 font-bold text-xs text-stone-700 dark:text-stone-300 group-hover:bg-stone-900 group-hover:text-white dark:group-hover:bg-stone-100 dark:group-hover:text-stone-900 transition-colors">
            {number}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {title}
            </h3>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
              {hasAnalysis ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                  <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> UPSC Notes Ready
                </span>
              ) : (
                <span className="text-[11px] text-stone-400 dark:text-stone-500">Click to study & analyze</span>
              )}
              {pyqCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                  <FileQuestion className="h-3 w-3 text-stone-400 dark:text-stone-500" />
                  {pyqCount} PYQs
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}
