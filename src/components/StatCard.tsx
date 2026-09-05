import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-xs transition-colors', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">{subtitle}</p>
          )}
        </div>
        <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-2.5">
          <Icon className="h-5 w-5 text-stone-600 dark:text-stone-300" />
        </div>
      </div>
    </div>
  );
}
