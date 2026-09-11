import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { FormattedQuestionText } from '@/components/FormattedQuestionText';
import prisma from '@/lib/db';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function ErrorLogPage() {
  let errors: Array<{
    id: number;
    errorType: string;
    description: string | null;
    createdAt: Date;
    answerAttempt: {
      pyq: { id: number; year: number; examStage: string; paper: string; questionText: string; contentJson?: string | null } | null;
    };
  }> = [];

  try {
    errors = await prisma.errorLog.findMany({
      include: { answerAttempt: { include: { pyq: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    // DB not ready
  }

  const errorTypeLabels: Record<string, string> = {
    did_not_know: 'Did Not Know',
    forgot: 'Forgot',
    misread: 'Misread',
    confused_concepts: 'Confused Concepts',
    silly_mistake: 'Silly Mistake',
    elimination_failure: 'Elimination Failure',
    time_issue: 'Time Issue',
    weak_understanding: 'Weak Understanding',
  };

  const groupedErrors: Record<string, typeof errors[0] & { count: number }> = {};
  const orphanedErrors: (typeof errors[0] & { count: number })[] = [];

  for (const err of errors) {
    const pyqId = err.answerAttempt?.pyq?.id;
    if (pyqId) {
      if (!groupedErrors[pyqId]) {
        groupedErrors[pyqId] = { ...err, count: 1 };
      } else {
        groupedErrors[pyqId].count += 1;
      }
    } else {
      orphanedErrors.push({ ...err, count: 1 });
    }
  }

  const finalErrors = [...Object.values(groupedErrors), ...orphanedErrors].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div>
      <PageHeader
        title="Error Log"
        description="Track and analyze your mistakes to improve performance"
      />

      {finalErrors.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No errors logged yet"
          description="Errors will appear here after you practice PYQs and log your mistakes."
        />
      ) : (
        <div className="space-y-3">
          {finalErrors.map((err) => (
            <div key={err.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                    {errorTypeLabels[err.errorType] || err.errorType}
                  </span>
                  {err.count > 1 && (
                    <span className="rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-stone-600 dark:text-stone-400">
                      Mistaken {err.count}x
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400">{new Date(err.createdAt).toLocaleDateString()}</span>
              </div>
              {err.description && (
                <p className="mt-2 text-sm text-stone-700 dark:text-stone-200">{err.description}</p>
              )}
              {err.answerAttempt?.pyq && (
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {err.answerAttempt.pyq.examStage} {err.answerAttempt.pyq.year} &bull; {err.answerAttempt.pyq.paper}
                  </p>
                  <Link href={`/pyq/${err.answerAttempt.pyq.id}`} className="block group">
                    <div className="text-sm text-stone-800 dark:text-stone-300 line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <FormattedQuestionText text={err.answerAttempt.pyq.questionText} contentJson={err.answerAttempt.pyq.contentJson} />
                    </div>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
