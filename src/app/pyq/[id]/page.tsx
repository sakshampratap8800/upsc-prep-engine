import { PageHeader } from '@/components/PageHeader';
import { SourceTrace } from '@/components/SourceTrace';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';

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
        {/* Source */}
        <SourceTrace type="pyq" exam={pyq.examStage} year={pyq.year} paper={pyq.paper} questionNumber={pyq.questionNumber || undefined} />

        {/* Question */}
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Question</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-800 whitespace-pre-wrap">{pyq.questionText}</p>

          {options.length > 0 && (
            <div className="mt-4 space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="rounded-lg border border-stone-100 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                  {opt}
                </div>
              ))}
            </div>
          )}

          {pyq.correctAnswer && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm font-medium text-green-800">Answer: {pyq.correctAnswer}</p>
            </div>
          )}
        </section>

        {/* Reverse Analysis: What was UPSC testing? */}
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">What Was UPSC Testing?</h2>
          <SourceTrace type="ai" />
          <div className="mt-4 space-y-3">
            {pyq.subjectArea && (
              <div className="flex items-start gap-3">
                <span className="text-xs font-semibold text-stone-500 w-32">Subject Area</span>
                <span className="text-sm text-stone-800">{pyq.subjectArea}</span>
              </div>
            )}
            {pyq.questionType && (
              <div className="flex items-start gap-3">
                <span className="text-xs font-semibold text-stone-500 w-32">Question Type</span>
                <span className="text-sm text-stone-800">{pyq.questionType}</span>
              </div>
            )}
            {pyq.directiveWord && (
              <div className="flex items-start gap-3">
                <span className="text-xs font-semibold text-stone-500 w-32">Directive</span>
                <span className="text-sm text-stone-800">{pyq.directiveWord}</span>
              </div>
            )}
            {pyq.explanation && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-stone-500">Explanation</p>
                <p className="mt-1 text-sm text-stone-700 leading-relaxed">{pyq.explanation}</p>
              </div>
            )}
          </div>
        </section>

        {/* Syllabus Connection */}
        {pyq.topics.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">Syllabus Connection</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {pyq.topics.map((t: { id: number; name: string; paper: string }) => (
                <span key={t.id} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  {t.name} ({t.paper})
                </span>
              ))}
            </div>
          </section>
        )}

        {/* NCERT Connection */}
        {pyq.chapters.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">NCERT Connection</h2>
            <div className="mt-3 space-y-2">
              {pyq.chapters.map((ch: { id: number; number: number; title: string; book: { className: number; title: string; subject: { name: string } } }) => (
                <div key={ch.id} className="rounded-lg bg-stone-50 p-3">
                  <p className="text-sm font-medium text-stone-800">Ch.{ch.number}: {ch.title}</p>
                  <p className="text-xs text-stone-500">{ch.book.subject.name} • Class {ch.book.className} • {ch.book.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related PYQs */}
        {relatedPYQs.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">Related PYQs</h2>
            <div className="mt-3 space-y-2">
              {relatedPYQs.map((rp) => (
                <a key={rp.id} href={`/pyq/${rp.id}`} className="block rounded-lg bg-stone-50 p-3 hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">{rp.year}</span>
                    <span>•</span><span>{rp.examStage}</span>
                    <span>•</span><span>{rp.paper}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-700 line-clamp-2">{rp.questionText}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Confidence */}
        {pyq.confidence < 1 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              ⚠️ AI classification uncertain (confidence: {(pyq.confidence * 100).toFixed(0)}%) — review required
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
