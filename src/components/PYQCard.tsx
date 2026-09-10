import Link from 'next/link';
import { RelevanceBadge } from './RelevanceBadge';
import { FormattedQuestionText } from './FormattedQuestionText';

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
  imageUrl?: string | null;
  contentJson?: string | null;
  isAiGenerated?: boolean;
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
  imageUrl,
  contentJson,
  isAiGenerated,
}: PYQCardProps) {
  return (
    <Link href={`/pyq/${id}`} className="block group">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-all duration-150 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-100/70 dark:hover:bg-stone-800/70 shadow-xs relative">
        {isAiGenerated && (
          <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white/20 flex items-center gap-1 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></span>
            AI Generated
          </div>
        )}
        <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
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
          {imageUrl && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
              🖼️ Diagram
            </span>
          )}
        </div>
        <div className={`mt-2 text-sm leading-relaxed text-stone-800 dark:text-stone-200 ${contentJson ? '' : 'line-clamp-4'}`}>
          <FormattedQuestionText text={questionText} contentJson={contentJson} />
        </div>
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
