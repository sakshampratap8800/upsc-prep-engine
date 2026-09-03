import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import prisma from '@/lib/db';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default async function SyllabusPage() {
  let topics: Array<{
    id: number;
    name: string;
    paper: string;
    description: string | null;
    children: Array<{ id: number; name: string; paper: string }>;
    _count: { pyqs: number };
  }> = [];

  try {
    topics = await prisma.syllabusTopic.findMany({
      where: { parentId: null },
      include: {
        children: { orderBy: { id: 'asc' } },
        _count: { select: { pyqs: true } },
      },
      orderBy: { paper: 'asc' },
    });
  } catch {
    // DB not ready
  }

  // Group by paper
  const byPaper: Record<string, typeof topics> = {};
  for (const t of topics) {
    if (!byPaper[t.paper]) byPaper[t.paper] = [];
    byPaper[t.paper].push(t);
  }

  return (
    <div>
      <PageHeader
        title="UPSC Syllabus"
        description="Official UPSC CSE syllabus structured by GS papers"
      />

      {topics.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Syllabus not imported yet"
          description="Import the UPSC syllabus PDF to view the structured syllabus."
          action={
            <Link href="/import" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
              Import Syllabus
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(byPaper).map(([paper, paperTopics]) => (
            <div key={paper}>
              <h2 className="mb-4 text-lg font-bold text-stone-900">{paper}</h2>
              <div className="space-y-3">
                {paperTopics.map((topic) => (
                  <div key={topic.id} className="rounded-xl border border-stone-200 bg-white p-5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-stone-900">{topic.name}</h3>
                      {topic._count.pyqs > 0 && (
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                          {topic._count.pyqs} PYQs
                        </span>
                      )}
                    </div>
                    {topic.description && (
                      <p className="mt-1 text-sm text-stone-500">{topic.description}</p>
                    )}
                    {topic.children.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {topic.children.map((sub) => (
                          <li key={sub.id} className="flex items-start gap-2 text-sm text-stone-600">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-300" />
                            {sub.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
