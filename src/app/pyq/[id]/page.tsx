import { PageHeader } from '@/components/PageHeader';
import { SourceTrace } from '@/components/SourceTrace';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { PYQInteractiveSolver } from '@/components/PYQInteractiveSolver';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PYQDetailPage({ params }: Props) {
  const { id } = await params;
  const pyqId = parseInt(id, 10);
  if (isNaN(pyqId)) notFound();

  const pyq = await prisma.pYQ.findUnique({
    where: { id: pyqId },
    include: {
      topics: true,
      concepts: true,
      chapters: { include: { book: { include: { subject: true } } } },
    },
  });

  if (!pyq) notFound();

  const options: string[] = pyq.optionsJson ? JSON.parse(pyq.optionsJson) : [];

  // Find related PYQs (same subject area or overlapping topics)
  let relatedPYQs: Array<{ id: number; year: number; examStage: string; paper: string; questionText: string }> = [];
  if (pyq.subjectArea) {
    relatedPYQs = await prisma.pYQ.findMany({
      where: { subjectArea: pyq.subjectArea, id: { not: pyq.id } },
      take: 5,
      orderBy: { year: 'desc' },
    });
  }

  return (
    <div>
      <PageHeader
        title={`${pyq.examStage} ${pyq.year} • ${pyq.paper}${pyq.questionNumber ? ` • Q.${pyq.questionNumber}` : ''}`}
        breadcrumbs={[
          { label: 'PYQ Browser', href: '/pyq' },
          { label: `${pyq.examStage} ${pyq.year}`, href: `/pyq?stage=${pyq.examStage}&year=${pyq.year}` },
          { label: pyq.paper },
        ]}
      />

      <div className="space-y-6">
        {/* Source Header */}
        <SourceTrace type="pyq" exam={pyq.examStage} year={pyq.year} paper={pyq.paper} questionNumber={pyq.questionNumber || undefined} />

        {/* Interactive Solver */}
        <PYQInteractiveSolver
          pyq={{
            id: pyq.id,
            year: pyq.year,
            examStage: pyq.examStage,
            paper: pyq.paper,
            questionNumber: pyq.questionNumber,
            questionText: pyq.questionText,
            options,
            correctAnswer: pyq.correctAnswer,
            explanation: pyq.explanation,
            subjectArea: pyq.subjectArea,
            difficulty: pyq.difficulty,
            directiveWord: pyq.directiveWord,
            questionType: pyq.questionType,
          }}
        />

        {/* Syllabus Connection */}
        {pyq.topics.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Syllabus Connection</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {pyq.topics.map((t: { id: number; name: string; paper: string }) => (
                <span key={t.id} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100">
                  {t.name} ({t.paper})
                </span>
              ))}
            </div>
          </section>
        )}

        {/* NCERT Connection */}
        {pyq.chapters.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">NCERT Connection</h2>
            <div className="mt-3 space-y-2">
              {pyq.chapters.map((ch: { id: number; number: number; title: string; book: { className: number; title: string; subject: { name: string } } }) => (
                <div key={ch.id} className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
                  <p className="text-sm font-bold text-stone-900">Ch.{ch.number}: {ch.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{ch.book.subject.name} • Class {ch.book.className} • {ch.book.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related PYQs */}
        {relatedPYQs.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Related PYQs in {pyq.subjectArea}</h2>
            <div className="mt-3 space-y-2">
              {relatedPYQs.map((rp) => (
                <a key={rp.id} href={`/pyq/${rp.id}`} className="block rounded-xl bg-stone-50 p-3.5 border border-stone-200 hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-bold text-stone-700">{rp.year}</span>
                    <span>•</span><span>{rp.examStage}</span>
                    <span>•</span><span>{rp.paper}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-800 line-clamp-2">{rp.questionText}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
