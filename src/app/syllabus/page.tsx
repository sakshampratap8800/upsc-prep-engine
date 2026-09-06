import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { getCachedSyllabusHierarchy } from '@/lib/cached-queries';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { SyllabusHierarchyView } from '@/components/SyllabusHierarchyView';

export const dynamic = 'force-dynamic';

export default async function SyllabusPage() {
  let topics: Array<{
    id: number;
    name: string;
    paper: string;
    description: string | null;
    children: Array<{ id: number; name: string; paper: string; _count?: { pyqs: number } }>;
    _count: { pyqs: number };
  }> = [];

  try {
    topics = await getCachedSyllabusHierarchy();
  } catch (err) {
    console.error('Error fetching syllabus topics:', err);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="UPSC CSE Syllabus"
        description="Complete official syllabus organized with hierarchical units, sub-clauses, thinkers, and direct PYQ linkages."
      />

      {topics.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Syllabus not loaded yet"
          description="Click below to import and initialize the structured UPSC syllabus."
          action={
            <Link
              href="/"
              className="rounded-lg bg-stone-900 dark:bg-stone-100 px-4 py-2 text-sm font-medium text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition"
            >
              Go to Dashboard
            </Link>
          }
        />
      ) : (
        <SyllabusHierarchyView initialTopics={topics} />
      )}
    </div>
  );
}
