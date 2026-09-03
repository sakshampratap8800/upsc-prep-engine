import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import prisma from '@/lib/db';
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import Link from 'next/link';

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

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-blue-600" />;
    return <Circle className="h-4 w-4 text-stone-300" />;
  };

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
                  <div key={task.id} className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-4">
                    {statusIcon(task.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800">{task.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
                        {task.weekNumber && <span>Week {task.weekNumber}</span>}
                        {task.dayOfWeek && <span>{task.dayOfWeek}</span>}
                        {task.timeAllocation && <span>{task.timeAllocation}</span>}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
