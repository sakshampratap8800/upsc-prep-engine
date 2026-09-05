import { PageHeader } from '@/components/PageHeader';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DataHealthPage() {
  let health = {
    books: 0,
    chapters: 0,
    chaptersWithTopics: 0,
    pyqs: 0,
    pyqsWithTopics: 0,
    syllabusTopics: 0,
    studyTasks: 0,
    revisionItems: 0,
    answerAttempts: 0,
    errorLogs: 0,
    importLogs: [] as Array<{ id: number; fileName: string; fileType: string; status: string; message: string | null; processedAt: Date }>,
    booksBySubject: [] as Array<{ name: string; _count: { books: number } }>,
    pyqsByStage: [] as Array<{ examStage: string; _count: { id: number } }>,
    pyqsByYear: [] as Array<{ year: number; _count: { id: number } }>,
    chaptersMissingTopics: [] as Array<{ id: number; title: string; book: { title: string } }>,
  };

  try {
    health.books = await prisma.book.count();
    health.chapters = await prisma.chapter.count();
    health.chaptersWithTopics = await prisma.chapter.count({ where: { topics: { some: {} } } });
    health.pyqs = await prisma.pYQ.count();
    health.pyqsWithTopics = await prisma.pYQ.count({ where: { topics: { some: {} } } });
    health.syllabusTopics = await prisma.syllabusTopic.count();
    health.studyTasks = await prisma.studyTask.count();
    health.revisionItems = await prisma.revisionItem.count();
    health.answerAttempts = await prisma.answerAttempt.count();
    health.errorLogs = await prisma.errorLog.count();

    health.importLogs = await prisma.importLog.findMany({ orderBy: { processedAt: 'desc' }, take: 20 });

    const subjectData = await prisma.subject.findMany({
      include: { _count: { select: { books: true } } },
    });
    health.booksBySubject = subjectData.map(s => ({ name: s.name, _count: { books: s._count.books } }));

    health.pyqsByStage = await prisma.pYQ.groupBy({ by: ['examStage'], _count: { id: true } }) as unknown as typeof health.pyqsByStage;
    health.pyqsByYear = await prisma.pYQ.groupBy({ by: ['year'], _count: { id: true }, orderBy: { year: 'desc' } }) as unknown as typeof health.pyqsByYear;

    health.chaptersMissingTopics = await prisma.chapter.findMany({
      where: { topics: { none: {} } },
      select: { id: true, title: true, book: { select: { title: true } } },
      take: 20,
    });
  } catch {
    // DB not ready
  }

  const mappingCoverage = health.chapters > 0
    ? Math.round((health.chaptersWithTopics / health.chapters) * 100)
    : 0;

  const pyqMappingCoverage = health.pyqs > 0
    ? Math.round((health.pyqsWithTopics / health.pyqs) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="Data Health Dashboard"
        description="System diagnostic: ingestion stats, mapping coverage, and data integrity"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Books', value: health.books },
          { label: 'Chapters', value: health.chapters },
          { label: 'PYQs', value: health.pyqs },
          { label: 'Syllabus Topics', value: health.syllabusTopics },
          { label: 'Study Tasks', value: health.studyTasks },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mapping Coverage */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Chapter → Topic Mapping</h2>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">{health.chaptersWithTopics} / {health.chapters} chapters mapped</span>
              <span className={`font-bold ${mappingCoverage >= 80 ? 'text-green-600' : mappingCoverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {mappingCoverage}%
              </span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-stone-100">
              <div
                className={`h-3 rounded-full ${mappingCoverage >= 80 ? 'bg-green-500' : mappingCoverage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${mappingCoverage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">PYQ → Topic Mapping</h2>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">{health.pyqsWithTopics} / {health.pyqs} PYQs mapped</span>
              <span className={`font-bold ${pyqMappingCoverage >= 80 ? 'text-green-600' : pyqMappingCoverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {pyqMappingCoverage}%
              </span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-stone-100">
              <div
                className={`h-3 rounded-full ${pyqMappingCoverage >= 80 ? 'bg-green-500' : pyqMappingCoverage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pyqMappingCoverage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Books by Subject */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Books by Subject</h2>
          <div className="mt-4 space-y-2">
            {health.booksBySubject.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                <span className="text-sm text-stone-700">{s.name}</span>
                <span className="text-sm font-semibold text-stone-900">{s._count.books}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">PYQs by Stage</h2>
          <div className="mt-4 space-y-2">
            {health.pyqsByStage.map((s) => (
              <div key={s.examStage} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                <span className="text-sm text-stone-700">{s.examStage}</span>
                <span className="text-sm font-semibold text-stone-900">{s._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PYQs by Year */}
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-900">PYQs by Year</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {health.pyqsByYear.map((y) => (
            <div key={y.year} className="rounded-lg bg-stone-50 px-3 py-2 text-center">
              <p className="text-sm font-bold text-stone-900">{y.year}</p>
              <p className="text-xs text-stone-500">{y._count.id} Qs</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chapters Missing Topics */}
      {health.chaptersMissingTopics.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900">Chapters Without Topic Mapping ({health.chapters - health.chaptersWithTopics})</h2>
          <p className="mt-1 text-xs text-amber-700">Run the intelligence pipeline to auto-map these chapters to syllabus topics.</p>
          <div className="mt-4 space-y-1">
            {health.chaptersMissingTopics.map((ch) => (
              <div key={ch.id} className="text-sm text-amber-800">
                <span className="font-medium">{ch.book.title}</span> → {ch.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Logs */}
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-900">Import History</h2>
        <div className="mt-4 space-y-2">
          {health.importLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-stone-700">{log.fileName}</p>
                <p className="text-xs text-stone-500">{log.fileType} • {log.message || ''}</p>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {log.status}
                </span>
                <p className="mt-0.5 text-xs text-stone-400">{new Date(log.processedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-stone-900">{health.answerAttempts}</p>
          <p className="text-xs text-stone-500">Answer Attempts</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-stone-900">{health.revisionItems}</p>
          <p className="text-xs text-stone-500">Revision Items</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-stone-900">{health.errorLogs}</p>
          <p className="text-xs text-stone-500">Error Logs</p>
        </div>
      </div>
    </div>
  );
}
