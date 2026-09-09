import { PageHeader } from '@/components/PageHeader';

export default function Loading() {
  return (
    <div>
      <PageHeader
        title="PYQ Browser"
        description="Loading Previous Year Questions..."
      />

      <div className="flex gap-6 mt-6">
        {/* Sidebar Skeleton */}
        <div className="w-56 flex-shrink-0">
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs space-y-4">
            <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
            <div className="space-y-2 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-full bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse" />
              ))}
            </div>

            <div className="h-4 w-16 bg-stone-200 dark:bg-stone-800 rounded animate-pulse mt-6" />
            <div className="space-y-2 mt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 w-full bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* List Skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="mb-3 flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
            <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
            <div className="h-4 w-16 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse" />
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-3 w-40 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
                  <div className="h-4 w-[90%] bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
                  <div className="h-4 w-[75%] bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
