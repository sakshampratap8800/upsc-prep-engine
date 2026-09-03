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
      <div className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 hover:bg-stone-50">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="font-semibold text-stone-700">{year}</span>
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
        <p className="mt-2 text-sm leading-relaxed text-stone-800 line-clamp-3">
          {questionText}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {subjectArea && (
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {subjectArea}
            </span>
          )}
          {difficulty && <RelevanceBadge level={difficulty} />}
        </div>
      </div>
    </Link>
  );
}
