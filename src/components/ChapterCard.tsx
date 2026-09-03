import Link from 'next/link';
import { BookOpen, FileQuestion, CheckCircle2, Circle } from 'lucide-react';

interface ChapterCardProps {
  id: number;
  number: number;
  title: string;
  bookId: number;
  subjectSlug: string;
  pyqCount: number;
  isCompleted?: boolean;
  conceptCount?: number;
}

export function ChapterCard({
  id,
  number,
  title,
  bookId,
  subjectSlug,
  pyqCount,
  isCompleted = false,
  conceptCount = 0,
}: ChapterCardProps) {
  return (
    <Link href={`/library/${subjectSlug}/${bookId}/${id}`} className="block">
      <div className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 hover:bg-stone-50">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-stone-300" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-stone-400">Chapter {number}</p>
            <h3 className="mt-0.5 font-semibold text-stone-900">{title}</h3>
            <div className="mt-2 flex items-center gap-4 text-xs text-stone-500">
              {pyqCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileQuestion className="h-3.5 w-3.5" />
                  {pyqCount} PYQs
                </span>
              )}
              {conceptCount > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {conceptCount} concepts
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
