import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-white px-6 py-16">
      <Icon className="h-12 w-12 text-stone-300" />
      <h3 className="mt-4 text-lg font-semibold text-stone-700">{title}</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-stone-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
