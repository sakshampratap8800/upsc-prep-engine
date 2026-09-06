import { PageHeader } from '@/components/PageHeader';
import { PYQCard } from '@/components/PYQCard';
import { EmptyState } from '@/components/EmptyState';
import prisma from '@/lib/db';
import { getCachedPyqStats } from '@/lib/cached-queries';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ stage?: string; year?: string; paper?: string; page?: string; openYear?: string }>;
}

type PYQListItem = {
  id: number;
  year: number;
  examStage: string;
  paper: string;
  questionNumber: number | null;
  questionText: string;
  subjectArea: string | null;
  difficulty: string | null;
};

type PageItem = number | 'ellipsis';
type YearStat = { year: number; _count: { id: number } };
type StageStat = { examStage: string; _count: { id: number } };
type YearStagePaperStat = { year: number; examStage: string; paper: string; _count: { id: number } };

function buildPyqHref(filters: { stage?: string; year?: number; paper?: string; page?: number; openYear?: number }) {
  const params = new URLSearchParams();
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.year) params.set('year', String(filters.year));
  if (filters.paper) params.set('paper', filters.paper);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.openYear) params.set('openYear', String(filters.openYear));

  const query = params.toString();
  return query ? `/pyq?${query}` : '/pyq';
}

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 20) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let pageNumber = Math.max(2, currentPage - 2); pageNumber <= Math.min(totalPages - 1, currentPage + 2); pageNumber++) {
    pages.add(pageNumber);
  }

  const sortedPages = Array.from(pages).sort((a, b) => a - b);
  const items: PageItem[] = [];
  for (const pageNumber of sortedPages) {
    const previous = items[items.length - 1];
    if (typeof previous === 'number' && pageNumber - previous > 1) {
      items.push('ellipsis');
    }
    items.push(pageNumber);
  }
  return items;
}

export default async function PYQBrowserPage({ searchParams }: Props) {
  const sp = await searchParams;
  const stage = sp.stage || '';
  const year = sp.year ? parseInt(sp.year, 10) : 0;
  const paper = sp.paper || '';
  const page = sp.page ? parseInt(sp.page, 10) : 1;
  const openYear = sp.openYear ? parseInt(sp.openYear, 10) : 0;
  const perPage = 20;

  let pyqs: PYQListItem[] = [];
  let totalCount = 0;
  let totalCountRaw = 0;
  let yearStats: YearStat[] = [];
  let stageStats: StageStat[] = [];
  let yearStagePaperStats: YearStagePaperStat[] = [];

  try {
    const where: Record<string, unknown> = {};
    if (stage) where.examStage = stage;
    if (year) where.year = year;
    if (paper) where.paper = paper;

    const [stats, pyqResults, count] = await Promise.all([
      getCachedPyqStats(),
      prisma.pYQ.findMany({
        where,
        orderBy: [{ year: 'desc' }, { examStage: 'asc' }, { paper: 'asc' }, { questionNumber: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          year: true,
          examStage: true,
          paper: true,
          questionNumber: true,
          questionText: true,
          subjectArea: true,
          difficulty: true,
        },
      }),
      prisma.pYQ.count({ where }),
    ]);

    totalCountRaw = stats.totalCountRaw;
    yearStats = stats.yearStats;
    stageStats = stats.stageStats;
    yearStagePaperStats = stats.yearStagePaperStats;

    pyqs = pyqResults;
    totalCount = count;
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalCount / perPage);
  const pageItems = getPageItems(page, totalPages);
  const groupedPyqs = pyqs.reduce<Record<string, PYQListItem[]>>((acc, pyq) => {
    const key = `${pyq.examStage} - ${pyq.paper}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pyq);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="PYQ Browser"
        description={`${totalCountRaw} Previous Year Questions • 2016–2026 • Prelims, Mains, Essay, Optionals`}
      />

      {totalCountRaw === 0 ? (
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
            <div className="sticky top-6 max-h-[75vh] overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Exam Stage</h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link href={buildPyqHref({ year, paper, openYear })} className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition ${!stage ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}>
                    All Stages
                  </Link>
                </li>
                {stageStats.map((s) => (
                  <li key={s.examStage}>
                    <Link href={buildPyqHref({ stage: s.examStage, year, paper, openYear })} className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition ${stage === s.examStage ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}>
                      {s.examStage} ({s._count.id})
                    </Link>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-sm font-bold text-stone-900 dark:text-stone-100">Year</h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link href={buildPyqHref({ stage, paper })} className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition ${!year ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}>
                    All Years
                  </Link>
                </li>
                {yearStats.map((y) => {
                  const isOpen = openYear === y.year;
                  const papersByStage = yearStagePaperStats
                    .filter((p) => p.year === y.year)
                    .reduce<Record<string, typeof yearStagePaperStats>>((acc, item) => {
                      if (!acc[item.examStage]) acc[item.examStage] = [];
                      acc[item.examStage].push(item);
                      return acc;
                    }, {});

                  return (
                    <li key={y.year}>
                      <Link href={buildPyqHref({ stage, year: y.year, openYear: isOpen ? undefined : y.year })} className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition ${year === y.year ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}>
                        {y.year} ({y._count.id})
                      </Link>
                      {isOpen && (
                        <ul className="mt-1 space-y-1 border-l border-stone-200 dark:border-stone-800 pl-3">
                          <li>
                            <Link href={buildPyqHref({ stage, year: y.year, openYear: y.year })} className={`block rounded-md px-3 py-1.5 text-xs font-medium transition ${year === y.year && !paper ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}>
                              All papers
                            </Link>
                          </li>
                          {Object.entries(papersByStage).map(([stageName, papers]) => (
                            <li key={`${y.year}-${stageName}`}>
                              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500">{stageName}</p>
                              <ul className="space-y-1">
                                {papers.map((p) => (
                                  <li key={`${y.year}-${stageName}-${p.paper}`}>
                                    <Link href={buildPyqHref({ stage: p.examStage, year: y.year, paper: p.paper, openYear: y.year })} className={`block rounded-md px-3 py-1.5 text-xs font-medium transition ${year === y.year && stage === p.examStage && paper === p.paper ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}>
                                      {p.paper} ({p._count.id})
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              {paper && (
                <div className="mt-4 rounded-lg bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 p-3">
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Active paper</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">{paper}</span>
                    <Link href={buildPyqHref({ stage, year, openYear })} className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
                      Clear
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PYQ List */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
              {Object.entries(groupedPyqs).map(([category, items]) => (
                <section key={category}>
                  <div className="mb-3 flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{category}</h2>
                    <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-300">
                      {items.length} shown
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map((pyq) => (
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
                </section>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link href={buildPyqHref({ stage, year, paper, page: page - 1, openYear })} className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition">
                    Previous
                  </Link>
                )}
                {pageItems.map((item, index) => item === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-stone-400 dark:text-stone-500">...</span>
                ) : (
                  <Link
                    key={item}
                    href={buildPyqHref({ stage, year, paper, page: item, openYear })}
                    className={`min-w-9 rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${
                      item === page
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {item}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={buildPyqHref({ stage, year, paper, page: page + 1, openYear })} className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition">
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
