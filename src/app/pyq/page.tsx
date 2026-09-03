import { PageHeader } from '@/components/PageHeader';
import { PYQCard } from '@/components/PYQCard';
import { EmptyState } from '@/components/EmptyState';
import prisma from '@/lib/db';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ stage?: string; year?: string; paper?: string; page?: string }>;
}

export default async function PYQBrowserPage({ searchParams }: Props) {
  const sp = await searchParams;
  const stage = sp.stage || '';
  const year = sp.year ? parseInt(sp.year, 10) : 0;
  const paper = sp.paper || '';
  const page = sp.page ? parseInt(sp.page, 10) : 1;
  const perPage = 20;

  let pyqs: Array<{ id: number; year: number; examStage: string; paper: string; questionNumber: number | null; questionText: string; subjectArea: string | null; difficulty: string | null }> = [];
  let totalCount = 0;
  let yearStats: Array<{ year: number; _count: { id: number } }> = [];
  let stageStats: Array<{ examStage: string; _count: { id: number } }> = [];

  try {
    const where: Record<string, unknown> = {};
    if (stage) where.examStage = stage;
    if (year) where.year = year;
    if (paper) where.paper = paper;

    [pyqs, totalCount] = await Promise.all([
      prisma.pYQ.findMany({
        where,
        orderBy: [{ year: 'desc' }, { questionNumber: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.pYQ.count({ where }),
    ]);

    // Get filter options
    const rawYearStats = await prisma.pYQ.groupBy({ by: ['year'], _count: { id: true }, orderBy: { year: 'desc' } });
    yearStats = rawYearStats;
    const rawStageStats = await prisma.pYQ.groupBy({ by: ['examStage'], _count: { id: true } });
    stageStats = rawStageStats;
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div>
      <PageHeader
        title="PYQ Browser"
        description={`${totalCount} Previous Year Questions • 2016–2026 • Prelims, Mains, Essay, Optionals`}
      />

      {totalCount === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No PYQs imported yet"
          description="Import your PYQ PDFs to start analyzing previous year questions."
          action={
            <Link href="/import" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
              Import PYQs
            </Link>
          }
        />
      ) : (
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h3 className="text-sm font-bold text-stone-900">Exam Stage</h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link href="/pyq" className={`block rounded-lg px-3 py-1.5 text-sm ${!stage ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
                    All ({totalCount})
                  </Link>
                </li>
                {stageStats.map((s) => (
                  <li key={s.examStage}>
                    <Link href={`/pyq?stage=${s.examStage}`} className={`block rounded-lg px-3 py-1.5 text-sm ${stage === s.examStage ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
                      {s.examStage} ({s._count.id})
                    </Link>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-sm font-bold text-stone-900">Year</h3>
              <ul className="mt-2 space-y-1">
                {yearStats.map((y) => (
                  <li key={y.year}>
                    <Link href={`/pyq?${stage ? `stage=${stage}&` : ''}year=${y.year}`} className={`block rounded-lg px-3 py-1.5 text-sm ${year === y.year ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
                      {y.year} ({y._count.id})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PYQ List */}
          <div className="flex-1">
            <div className="space-y-3">
              {pyqs.map((pyq) => (
                <PYQCard
                  key={pyq.id}
                  id={pyq.id}
                  year={pyq.year}
                  examStage={pyq.examStage}
                  paper={pyq.paper}
                  questionNumber={pyq.questionNumber || undefined}
                  questionText={pyq.questionText}
                  subjectArea={pyq.subjectArea || undefined}
                  difficulty={pyq.difficulty || undefined}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link href={`/pyq?${stage ? `stage=${stage}&` : ''}${year ? `year=${year}&` : ''}page=${page - 1}`} className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">
                    Previous
                  </Link>
                )}
                <span className="text-sm text-stone-500">Page {page} of {totalPages}</span>
                {page < totalPages && (
                  <Link href={`/pyq?${stage ? `stage=${stage}&` : ''}${year ? `year=${year}&` : ''}page=${page + 1}`} className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
