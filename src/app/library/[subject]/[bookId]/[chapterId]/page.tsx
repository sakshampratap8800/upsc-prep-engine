import { PageHeader } from '@/components/PageHeader';
import { SourceTrace } from '@/components/SourceTrace';
import { RelevanceBadge } from '@/components/RelevanceBadge';
import { PYQCard } from '@/components/PYQCard';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ subject: string; bookId: string; chapterId: string }>;
}

export default async function ChapterDetailPage({ params }: Props) {
  const { subject, bookId, chapterId } = await params;
  const chapId = parseInt(chapterId, 10);
  if (isNaN(chapId)) notFound();

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapId },
    include: {
      book: { include: { subject: true } },
      pyqs: true,
      topics: true,
      revisionItems: true,
    },
  });

  if (!chapter) notFound();

  const keyConcepts: string[] = chapter.keyConceptsJson ? JSON.parse(chapter.keyConceptsJson) : [];
  const definitions: Array<{ term: string; definition: string }> = chapter.definitionsJson ? JSON.parse(chapter.definitionsJson) : [];
  const findOutQuestions: string[] = chapter.findOutQuestionsJson ? JSON.parse(chapter.findOutQuestionsJson) : [];

  return (
    <div>
      <PageHeader
        title={`Chapter ${chapter.number}: ${chapter.title}`}
        description={`${chapter.book.subject.name} • Class ${chapter.book.className} • ${chapter.book.title}`}
        breadcrumbs={[
          { label: 'Library', href: '/library' },
          { label: chapter.book.subject.name, href: '/library' },
          { label: chapter.book.title, href: `/library/${subject}/${bookId}` },
          { label: `Ch. ${chapter.number}` },
        ]}
      />

      <div className="space-y-8">
        {/* Source */}
        <SourceTrace type="ncert" book={chapter.book.title} chapter={`Chapter ${chapter.number}`} />

        {/* Syllabus Connection */}
        {chapter.topics.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">UPSC Syllabus Connection</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {chapter.topics.map((t: { id: number; name: string; paper: string }) => (
                <span key={t.id} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {t.name} ({t.paper})
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Key Concepts */}
        {keyConcepts.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">Key Concepts</h2>
            <ul className="mt-3 space-y-2">
              {keyConcepts.map((concept, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-400" />
                  {concept}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Definitions */}
        {definitions.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">Important Definitions</h2>
            <dl className="mt-3 space-y-3">
              {definitions.map((def, i) => (
                <div key={i} className="rounded-lg bg-stone-50 p-3">
                  <dt className="text-sm font-semibold text-stone-800">{def.term}</dt>
                  <dd className="mt-1 text-sm text-stone-600">{def.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Find Out Questions */}
        {findOutQuestions.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">NCERT "Find Out" Questions</h2>
            <ul className="mt-3 space-y-2">
              {findOutQuestions.map((q, i) => (
                <li key={i} className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm text-stone-700">
                  {q}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Chapter Content Preview */}
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Chapter Content</h2>
          <div className="mt-3 max-h-96 overflow-y-auto">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {chapter.summary || chapter.content.slice(0, 2000)}
            </p>
          </div>
        </section>

        {/* Related PYQs */}
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">
            Related PYQs
            {chapter.pyqs.length > 0 && (
              <span className="ml-2 text-sm font-normal text-stone-500">({chapter.pyqs.length})</span>
            )}
          </h2>
          {chapter.pyqs.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No PYQs mapped to this chapter yet. Run the intelligence pipeline to auto-map.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {chapter.pyqs.map((pyq: { id: number; year: number; examStage: string; paper: string; questionNumber: number | null; questionText: string; subjectArea: string | null; difficulty: string | null; }) => (
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
          )}
        </section>

        {/* Revision Summary */}
        {chapter.revisionItems.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-900">Revision Items</h2>
            <div className="mt-3 space-y-2">
              {chapter.revisionItems.map((item: { id: number; title: string; priority: string; }) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                  <span className="text-sm text-stone-700">{item.title}</span>
                  <RelevanceBadge level={item.priority} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
