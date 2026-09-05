import { cn } from '@/lib/utils';

interface RelevanceBadgeProps {
  level: string;
  size?: 'sm' | 'md';
}

export function RelevanceBadge({ level, size = 'sm' }: RelevanceBadgeProps) {
  const colors: Record<string, string> = {
    'HIGH PRIORITY': 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60',
    'MUST KNOW': 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60',
    'IMPORTANT': 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
    'SHOULD KNOW': 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
    'MEDIUM': 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60',
    'LOW PRIORITY': 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700',
    'NICE TO KNOW': 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700',
    'EASY': 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
    'HARD': 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/60',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        colors[level.toUpperCase()] || 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
      )}
    >
      {level}
    </span>
  );
}
