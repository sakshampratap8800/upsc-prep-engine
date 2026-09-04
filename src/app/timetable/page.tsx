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

  return (
    <div>
      <PageHeader
        title="Study Timetable"
        description="Your 18-month UPSC preparation schedule"
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Timetable not imported yet"
          description="Import your timetable to see your study schedule."
          action={
            <Link href="/import" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
              Import Timetable
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(byMonth).sort(([a], [b]) => Number(a) - Number(b)).map(([month, monthTasks]) => (
            <div key={month}>
              <h2 className="mb-4 text-lg font-bold text-stone-900">
                {Number(month) === 0 ? 'General Tasks' : `Month ${month}`}
              </h2>
              <div className="space-y-2">
                {monthTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
