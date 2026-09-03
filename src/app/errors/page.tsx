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
            <div key={err.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {errorTypeLabels[err.errorType] || err.errorType}
                </span>
                <span className="text-xs text-stone-500">{new Date(err.createdAt).toLocaleDateString()}</span>
              </div>
              {err.description && (
                <p className="mt-2 text-sm text-stone-700">{err.description}</p>
              )}
              {err.answerAttempt?.pyq && (
                <p className="mt-2 text-xs text-stone-500">
                  {err.answerAttempt.pyq.examStage} {err.answerAttempt.pyq.year} \u2022 {err.answerAttempt.pyq.paper}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
