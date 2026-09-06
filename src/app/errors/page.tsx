import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import prisma from '@/lib/db';
import { AlertCircle } from 'lucide-react';

export default async function ErrorLogPage() {
  let errors: Array<{
    id: number;
    errorType: string;
    description: string | null;
    createdAt: Date;
    answerAttempt: {
      pyq: { year: number; examStage: string; paper: string; questionText: string } | null;
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

  return (
    <div>
      <PageHeader
        title="Error Log"
        description="Track and analyze your mistakes to improve performance"
      />

      {errors.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No errors logged yet"
          description="Errors will appear here after you practice PYQs and log your mistakes."
        />
      ) : (
        <div className="space-y-3">
          {errors.map((err) => (
            <div key={err.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                  {errorTypeLabels[err.errorType] || err.errorType}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">{new Date(err.createdAt).toLocaleDateString()}</span>
              </div>
              {err.description && (
                <p className="mt-2 text-sm text-stone-700 dark:text-stone-200">{err.description}</p>
              )}
              {err.answerAttempt?.pyq && (
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                  {err.answerAttempt.pyq.examStage} {err.answerAttempt.pyq.year} &bull; {err.answerAttempt.pyq.paper}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
