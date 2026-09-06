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
          ? 'border-green-200 dark:border-green-900/60 bg-green-50/40 dark:bg-green-950/20 opacity-75'
          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-xs'
      } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={handleToggle}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <button className="focus:outline-none" aria-label="Toggle completion status">
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : task.status === 'in_progress' ? (
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Circle className="h-5 w-5 text-stone-300 dark:text-stone-600 hover:text-stone-400" />
            )}
          </button>
          <div>
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{task.dayOfWeek || `Day`}</span>
            {task.weekNumber && (
              <span className="ml-2 text-xs font-medium text-stone-500 dark:text-stone-400">Week {task.weekNumber}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.phase && (
            <span className="hidden sm:inline-block rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-700 dark:text-stone-300">
              {task.phase}
            </span>
          )}
          {task.timeAllocation && (
            <span className="rounded-md bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              ⏱ {task.timeAllocation}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isDone
                ? 'bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-900/60'
                : task.status === 'in_progress'
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
            }`}
          >
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* 3 Structured Columns / Sections */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {/* 1. Primary Study */}
        <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/30 p-3 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
            <BookOpen className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
            <span>Primary Study (Source)</span>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDone ? 'text-stone-500 line-through' : 'text-stone-900 dark:text-stone-100 font-medium'}`}>
            {task.title}
          </p>
        </div>

        {/* 2. PYQ / Practice / Revision */}
        <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/30 p-3 border border-amber-100 dark:border-amber-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
            <Target className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            <span>PYQ / Practice / Revision</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {task.practiceRevision || 'Closed-book recall + 10-25 MCQs/PYQs; revise only recall gaps.'}
          </p>
        </div>

        {/* 3. Website Action + Concrete Output */}
        <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 p-3 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
            <Globe className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Website Action + Output</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {task.websiteAction || 'Mark study complete; inspect mapped PYQs; flag bad extraction/mapping.'}
          </p>
        </div>
      </div>
    </div>
  );
}
