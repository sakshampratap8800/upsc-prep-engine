import { PageHeader } from '@/components/PageHeader';

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Health Diagnostics"
        description="Loading database health metrics..."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs animate-pulse">
            <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded mb-2" />
            <div className="h-8 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
