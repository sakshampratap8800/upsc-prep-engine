import prisma from '@/lib/db';
import { unstable_cache } from 'next/cache';

export interface PyqSidebarStats {
  totalCountRaw: number;
  yearStats: { year: number; _count: { id: number } }[];
  stageStats: { examStage: string; _count: { id: number } }[];
  yearStagePaperStats: { year: number; examStage: string; paper: string; _count: { id: number } }[];
}

const STAGE_ORDER = ['Prelims', 'Mains', 'Essay', 'Anthropology', 'Sociology'];

export const getCachedPyqStats = unstable_cache(
  async (): Promise<PyqSidebarStats> => {
    const rows = await prisma.pYQ.groupBy({
      by: ['year', 'examStage', 'paper'],
      _count: { id: true },
      orderBy: [{ year: 'desc' }, { examStage: 'asc' }, { paper: 'asc' }],
    });

    const yearStatsMap = new Map<number, number>();
    const stageStatsMap = new Map<string, number>();
    let totalCountRaw = 0;

    const yearStagePaperStats = rows.map((r) => {
      yearStatsMap.set(r.year, (yearStatsMap.get(r.year) || 0) + r._count.id);
      stageStatsMap.set(r.examStage, (stageStatsMap.get(r.examStage) || 0) + r._count.id);
      totalCountRaw += r._count.id;
      return {
        year: r.year,
        examStage: r.examStage,
        paper: r.paper,
        _count: { id: r._count.id },
      };
    });

    const yearStats = Array.from(yearStatsMap.entries())
      .map(([year, count]) => ({ year, _count: { id: count } }))
      .sort((a, b) => b.year - a.year);

    const stageStats = Array.from(stageStatsMap.entries())
      .map(([examStage, count]) => ({ examStage, _count: { id: count } }))
      .sort((a, b) => {
        const orderA = STAGE_ORDER.indexOf(a.examStage);
        const orderB = STAGE_ORDER.indexOf(b.examStage);
        if (orderA !== -1 && orderB !== -1) return orderA - orderB;
        if (orderA !== -1) return -1;
        if (orderB !== -1) return 1;
        return a.examStage.localeCompare(b.examStage);
      });

    return {
      totalCountRaw,
      yearStats,
      stageStats,
      yearStagePaperStats,
    };
  },
  ['pyq-sidebar-aggregate-stats-v2'],
  { revalidate: 3600, tags: ['pyq-stats'] }
);

export const getCachedSyllabusHierarchy = unstable_cache(
  async () => {
    return prisma.syllabusTopic.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { id: 'asc' },
          include: {
            _count: { select: { pyqs: true } },
          },
        },
        _count: { select: { pyqs: true } },
      },
      orderBy: { id: 'asc' },
    });
  },
  ['syllabus-hierarchy-tree-v3'],
  { revalidate: 3600, tags: ['syllabus'] }
);

export const getCachedDashboardStats = unstable_cache(
  async () => {
    const [books, chapters, pyqs, syllabusTopics, revisionsDue, pendingTasks] = await Promise.all([
      prisma.book.count(),
      prisma.chapter.count(),
      prisma.pYQ.count(),
      prisma.syllabusTopic.count(),
      prisma.revisionItem.count({ where: { status: 'pending' } }),
      prisma.studyTask.count({ where: { status: 'not_started' } }),
    ]);
    return { books, chapters, pyqs, syllabusTopics, revisionsDue, pendingTasks };
  },
  ['dashboard-summary-stats-v2'],
  { revalidate: 300, tags: ['dashboard'] }
);
