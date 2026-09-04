import { BookOpen, FileQuestion, GraduationCap, ClipboardList, RotateCcw, Calendar } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { getBookCount, getChapterCount, getPyqCount, getSyllabusTopicCount, getDueRevisionCount, getPendingTaskCount } from '@/lib/queries';
import prisma from '@/lib/db';
import Link from 'next/link';

export default async function DashboardPage() {
  let stats = { books: 0, chapters: 0, pyqs: 0, syllabusTopics: 0, revisionsDue: 0, pendingTasks: 0 };
  let recentImports: Array<{ id: number; fileName: string; fileType: string; status: string; message: string | null; processedAt: Date }> = [];
  let todayTasks: Array<{ id: number; title: string; description: string | null; status: string; timeAllocation: string | null }> = [];

  try {
    const [bookCount, chapterCount, pyqCount, topicCount, revisionCount, taskCount] = await Promise.all([
      getBookCount(),
      getChapterCount(),
      getPyqCount(),
      getSyllabusTopicCount(),
      getDueRevisionCount(),
      getPendingTaskCount(),
    ]);
    stats = { books: bookCount, chapters: chapterCount, pyqs: pyqCount, syllabusTopics: topicCount, revisionsDue: revisionCount, pendingTasks: taskCount };

    recentImports = await prisma.importLog.findMany({ orderBy: { processedAt: 'desc' }, take: 5 });
    todayTasks = await prisma.studyTask.findMany({ where: { status: { in: ['not_started', 'in_progress'] } }, take: 5, orderBy: { id: 'asc' } });
  } catch {
    // Database may not be initialized yet
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Personal UPSC CSE Preparation Engine • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {stats.books === 0 && stats.pyqs === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
          <h2 className="text-xl font-bold text-stone-700">Welcome to UPSC Prep Engine</h2>
          <p className="mt-2 text-sm text-stone-500">Your data hasn't been imported yet. Start by importing your study materials.</p>
          <Link href="/import" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors">
            Import Data
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard title="Books" value={stats.books} icon={BookOpen} />
            <StatCard title="Chapters" value={stats.chapters} icon={BookOpen} />
            <StatCard title="PYQs" value={stats.pyqs} icon={FileQuestion} />
            <StatCard title="Syllabus Topics" value={stats.syllabusTopics} icon={GraduationCap} />
            <StatCard title="Revisions Due" value={stats.revisionsDue} icon={RotateCcw} />
            <StatCard title="Pending Tasks" value={stats.pendingTasks} icon={Calendar} />
          </div>

          {/* Two column layout */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Today's Study */}
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-900">Today's Study</h2>
              {todayTasks.length === 0 ? (
                <p className="mt-4 text-sm text-stone-500">No tasks scheduled. Check the timetable.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {todayTasks.map((task) => (
                    <li key={task.id} className="flex items-start gap-3 rounded-lg bg-stone-50 p-3">
                      <ClipboardList className="mt-0.5 h-4 w-4 text-stone-400" />
                      <div>
                        <p className="text-sm font-medium text-stone-800">{task.title}</p>
                        {task.timeAllocation && (
                          <p className="mt-0.5 text-xs text-stone-500">{task.timeAllocation}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Imports */}
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-900">Recent Import Activity</h2>
              {recentImports.length === 0 ? (
                <p className="mt-4 text-sm text-stone-500">No imports yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {recentImports.map((imp) => (
                    <li key={imp.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-stone-700">{imp.fileName}</p>
                        <p className="text-xs text-stone-500">{imp.fileType} • {imp.message || ''}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${imp.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {imp.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: 'Browse Library', href: '/library', desc: 'NCERT textbooks & chapters' },
              { label: 'PYQ Analysis', href: '/pyq', desc: 'Previous year questions' },
              { label: 'Syllabus Map', href: '/syllabus', desc: 'UPSC syllabus structure' },
              { label: 'Practice', href: '/practice', desc: 'Prelims & Mains practice' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 hover:bg-stone-50">
                <h3 className="font-semibold text-stone-900">{item.label}</h3>
                <p className="mt-1 text-xs text-stone-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
