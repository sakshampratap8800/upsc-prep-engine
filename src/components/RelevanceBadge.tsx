import { cn } from '@/lib/utils';

interface RelevanceBadgeProps {
  level: string;
  size?: 'sm' | 'md';
}

export function RelevanceBadge({ level, size = 'sm' }: RelevanceBadgeProps) {
  const colors: Record<string, string> = {
    'HIGH PRIORITY': 'bg-red-100 text-red-800 border-red-200',
    'MUST KNOW': 'bg-red-100 text-red-800 border-red-200',
    'IMPORTANT': 'bg-amber-100 text-amber-800 border-amber-200',
    'SHOULD KNOW': 'bg-amber-100 text-amber-800 border-amber-200',
    'MEDIUM': 'bg-blue-100 text-blue-800 border-blue-200',
    'LOW PRIORITY': 'bg-stone-100 text-stone-600 border-stone-200',
    'NICE TO KNOW': 'bg-stone-100 text-stone-600 border-stone-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        colors[level.toUpperCase()] || 'bg-stone-100 text-stone-600 border-stone-200'
      )}
    >
      {level}
    </span>
  );
}
