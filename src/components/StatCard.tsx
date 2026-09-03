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
    <div className={cn('rounded-xl border border-stone-200 bg-white p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-stone-400">{subtitle}</p>
          )}
        </div>
        <div className="rounded-lg bg-stone-100 p-2.5">
          <Icon className="h-5 w-5 text-stone-600" />
        </div>
      </div>
    </div>
  );
}
