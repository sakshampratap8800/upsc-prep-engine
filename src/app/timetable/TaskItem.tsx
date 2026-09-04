'use client';

import { CheckCircle2, Circle, Clock, BookOpen, Target, Globe } from 'lucide-react';
import { useTransition } from 'react';
import { toggleTaskStatus } from './actions';

interface Task {
  id: number;
  title: string;
  practiceRevision: string | null;
  websiteAction: string | null;
  phase: string | null;
  weekNumber: number | null;
  dayOfWeek: string | null;
  timeAllocation: string | null;
  status: string;
}

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(() => {
      toggleTaskStatus(task.id, task.status);
    });
  };

  const isDone = task.status === 'completed';

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all cursor-pointer ${
        isDone
          ? 'border-green-200 bg-green-50/40 opacity-75'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
      } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={handleToggle}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <button className="focus:outline-none" aria-label="Toggle completion status">
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : task.status === 'in_progress' ? (
              <Clock className="h-5 w-5 text-blue-600" />
            ) : (
              <Circle className="h-5 w-5 text-stone-300 hover:text-stone-400" />
            )}
          </button>
          <div>
            <span className="text-xs font-bold text-stone-900">{task.dayOfWeek || `Day`}</span>
            {task.weekNumber && (
              <span className="ml-2 text-xs font-medium text-stone-500">Week {task.weekNumber}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.phase && (
            <span className="hidden sm:inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
              {task.phase}
            </span>
          )}
          {task.timeAllocation && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
              ⏱ {task.timeAllocation}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isDone
                ? 'bg-green-100 text-green-800'
                : task.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* 3 Structured Columns / Sections */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {/* 1. Primary Study */}
        <div className="rounded-lg bg-blue-50/60 p-3 border border-blue-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
            <BookOpen className="h-3.5 w-3.5 text-blue-700" />
            <span>Primary Study (Source)</span>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDone ? 'text-stone-500 line-through' : 'text-stone-900 font-medium'}`}>
            {task.title}
          </p>
        </div>

        {/* 2. PYQ / Practice / Revision */}
        <div className="rounded-lg bg-amber-50/60 p-3 border border-amber-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
            <Target className="h-3.5 w-3.5 text-amber-700" />
            <span>PYQ / Practice / Revision</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-700">
            {task.practiceRevision || 'Closed-book recall + 10-25 MCQs/PYQs; revise only recall gaps.'}
          </p>
        </div>

        {/* 3. Website Action + Concrete Output */}
        <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
            <Globe className="h-3.5 w-3.5 text-emerald-700" />
            <span>Website Action + Output</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-700">
            {task.websiteAction || 'Mark study complete; inspect mapped PYQs; flag bad extraction/mapping.'}
          </p>
        </div>
      </div>
    </div>
  );
}
