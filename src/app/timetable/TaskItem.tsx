'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useTransition } from 'react';
import { toggleTaskStatus } from './actions';

interface Task {
  id: number;
  title: string;
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

  return (
    <div 
      className={`flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-stone-50 ${
        task.status === 'completed' ? 'border-green-200 bg-green-50/50' : 'border-stone-200 bg-white'
      } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={handleToggle}
    >
      <button className="mt-0.5 focus:outline-none">
        {task.status === 'completed' ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : task.status === 'in_progress' ? (
          <Clock className="h-5 w-5 text-blue-600" />
        ) : (
          <Circle className="h-5 w-5 text-stone-300 hover:text-stone-400" />
        )}
      </button>
      
      <div className="flex-1">
        <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-stone-500 line-through' : 'text-stone-800'}`}>
          {task.title}
        </p>
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
  );
}
