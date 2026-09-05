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
      <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 transition-all duration-200 hover:border-stone-400 hover:shadow-sm">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-bold text-xs text-stone-700 group-hover:bg-stone-900 group-hover:text-white transition-colors">
            {number}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-stone-900 leading-snug group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-500">
              {hasAnalysis ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                  <Sparkles className="h-3 w-3 text-emerald-600" /> UPSC Notes Ready
                </span>
              ) : (
                <span className="text-[11px] text-stone-400">Click to study & analyze</span>
              )}
              {pyqCount > 0 && (
                <span className="flex items-center gap-1 text-[11px]">
                  <FileQuestion className="h-3 w-3 text-stone-400" />
                  {pyqCount} PYQs
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}
