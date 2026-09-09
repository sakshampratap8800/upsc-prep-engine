import { PageHeader } from '@/components/PageHeader';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Comprehensive Syllabus"
        description="Loading official syllabus topics and subtopics..."
      />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs animate-pulse">
            <div className="h-6 w-1/3 bg-stone-200 dark:bg-stone-800 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-lg" />
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-lg" />
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
