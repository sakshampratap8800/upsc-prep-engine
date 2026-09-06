import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import prisma from '@/lib/db';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { TaskItem } from './TaskItem';

export default async function TimetablePage() {
  let tasks: Array<{
    id: number;
    title: string;
    description: string | null;
    practiceRevision: string | null;
    websiteAction: string | null;
    phase: string | null;
    monthNumber: number | null;
    weekNumber: number | null;
    dayOfWeek: string | null;
    timeAllocation: string | null;
    status: string;
  }> = [];

  try {
    tasks = await prisma.studyTask.findMany({
      orderBy: [{ monthNumber: 'asc' }, { weekNumber: 'asc' }, { id: 'asc' }],
    });
  } catch {
    // DB not ready
  }

  // Group by month
  const byMonth: Record<number, typeof tasks> = {};
  for (const t of tasks) {
    const m = t.monthNumber || 0;
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(t);
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Timetable"
        description="Your full UPSC CSE 2027 daily study plan: 49 Weeks + Post-Mains Interview Prep"
        actions={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-semibold text-stone-500">Progress</span>
              <p className="text-sm font-bold text-stone-900">{completedCount} / {tasks.length} ({progressPercent}%)</p>
            </div>
            <div className="h-2.5 w-28 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Timetable not imported yet"
          description="Import your timetable to see your study schedule."
          action={
            <Link href="/" className="rounded-lg bg-stone-900 dark:bg-stone-100 px-4 py-2 text-sm font-medium text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200">
              Go to Dashboard
            </Link>
          }
        />
      ) : (
        <div className="space-y-10">
          {Object.entries(byMonth).sort(([a], [b]) => Number(a) - Number(b)).map(([month, monthTasks]) => {
            const mNum = Number(month);
            const phaseTitle = mNum === 12
              ? 'Post-Mains Interview Preparation (P1 - P6)'
              : mNum <= 2
              ? 'Month ' + mNum + ' • NCERT Foundations'
              : mNum <= 3
              ? 'Month ' + mNum + ' • Standard References & GS Pass'
              : mNum <= 5
              ? 'Month ' + mNum + ' • Sociology Optional Core (Papers I & II)'
              : mNum <= 8
              ? 'Month ' + mNum + ' • Prelims Intensive & Mock Diagnostics'
              : 'Month ' + mNum + ' • Mains Writing & Simulations';

            return (
              <div key={month} className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h2 className="text-base font-bold text-stone-900">
                    {phaseTitle}
                  </h2>
                  <span className="text-xs font-medium text-stone-500">
                    {monthTasks.length} tasks
                  </span>
                </div>
                <div className="space-y-3">
                  {monthTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
