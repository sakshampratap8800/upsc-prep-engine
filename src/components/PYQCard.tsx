import Link from 'next/link';
import { RelevanceBadge } from './RelevanceBadge';

interface PYQCardProps {
  id: number;
  year: number;
  examStage: string;
  paper: string;
  questionNumber?: number;
  questionText: string;
  subjectArea?: string;
  difficulty?: string;
  conceptTested?: string;
}

export function PYQCard({
  id,
  year,
  examStage,
  paper,
  questionNumber,
  questionText,
  subjectArea,
  difficulty,
}: PYQCardProps) {
  return (
    <Link href={`/pyq/${id}`} className="block">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-colors hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-850 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-stone-700 dark:text-stone-200">{year}</span>
          <span>•</span>
          <span>{examStage}</span>
          <span>•</span>
          <span>{paper}</span>
          {questionNumber && (
            <>
              <span>•</span>
              <span>Q.{questionNumber}</span>
            </>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line line-clamp-4">
          {questionText}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {subjectArea && (
            <span className="rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-300">
              {subjectArea}
            </span>
          )}
          {difficulty && <RelevanceBadge level={difficulty} />}
        </div>
      </div>
    </Link>
  );
}
