import { PageHeader } from '@/components/PageHeader';
import prisma from '@/lib/db';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ year?: string; paper?: string }>;
}

export default async function MainsPracticePage({ searchParams }: Props) {
  const sp = await searchParams;
  const year = sp.year ? parseInt(sp.year, 10) : 0;
  const paper = sp.paper || '';

  const where: Record<string, unknown> = { examStage: 'Mains' };
  if (year) where.year = year;
  if (paper) where.paper = paper;

  let questions: Array<{
    id: number;
    year: number;
    paper: string;
    questionNumber: number | null;
    questionText: string;
    questionDemand: string | null;
    directiveWord: string | null;
  }> = [];

  let yearStats: Array<{ year: number; _count: { id: number } }> = [];

  try {
    questions = await prisma.pYQ.findMany({
      where,
      orderBy: [{ year: 'desc' }, { questionNumber: 'asc' }],
      take: 20,
    });

    yearStats = await prisma.pYQ.groupBy({
      by: ['year'],
      where: { examStage: 'Mains' },
      _count: { id: true },
      orderBy: { year: 'desc' },
    }) as unknown as typeof yearStats;
  } catch {
    // DB not ready
  }

  return (
    <div>
      <PageHeader
        title="Mains Answer Writing"
        description="Practice structured answer writing with actual UPSC Mains questions"
        breadcrumbs={[
          { label: 'Practice', href: '/practice' },
          { label: 'Mains' },
        ]}
      />

      <div className="flex gap-6">
        {/* Year Filter Sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Year</h3>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/practice/mains" className={`block rounded-lg px-3 py-1.5 text-sm ${!year ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
                  All Years
                </Link>
              </li>
              {yearStats.map((y) => (
                <li key={y.year}>
                  <Link href={`/practice/mains?year=${y.year}`} className={`block rounded-lg px-3 py-1.5 text-sm ${year === y.year ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
                    {y.year} ({y._count.id})
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-4 text-sm font-bold text-stone-900 dark:text-stone-100">Paper</h3>
            <ul className="mt-2 space-y-1">
              {['GS-I', 'GS-II', 'GS-III', 'GS-IV'].map((p) => (
                <li key={p}>
                  <Link href={`/practice/mains?${year ? `year=${year}&` : ''}paper=${p}`} className={`block rounded-lg px-3 py-1.5 text-sm ${paper === p ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
                    {p}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 space-y-4">
          {questions.length === 0 ? (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 text-center shadow-xs">
              <p className="text-sm text-stone-500 dark:text-stone-400">No Mains questions found for this filter.</p>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs transition-colors">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span className="rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-0.5 font-medium text-stone-700 dark:text-stone-300">{q.paper}</span>
                  <span>{q.year}</span>
                  {q.questionNumber && <span>Q.{q.questionNumber}</span>}
                  {q.directiveWord && (
                    <span className="rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 font-medium text-blue-700 dark:text-blue-300">{q.directiveWord}</span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-800 dark:text-stone-200">{q.questionText}</p>
                {q.questionDemand && (
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 italic">Demand: {q.questionDemand}</p>
                )}
                <Link
                  href={`/pyq/${q.id}`}
                  className="mt-3 inline-block text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition"
                >
                  View Details &rarr;
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
