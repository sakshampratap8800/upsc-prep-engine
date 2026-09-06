import { PageHeader } from '@/components/PageHeader';
import { ChapterCard } from '@/components/ChapterCard';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ExternalLink, Sparkles, FileText } from 'lucide-react';

interface Props {
  params: Promise<{ subject: string; bookId: string }>;
}

const GDRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1WM938D-obvqcgG1ubET5YfV6JWj58ZxJ?usp=drive_link';

export default async function BookDetailPage({ params }: Props) {
  const { subject, bookId } = await params;
  const id = parseInt(bookId, 10);
  if (isNaN(id)) notFound();

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      subject: true,
      chapters: {
        orderBy: { number: 'asc' },
        include: {
          pyqs: { select: { id: true } },
        },
      },
    },
  });

  if (!book) notFound();

  const analyzedCount = book.chapters.filter((c) =>
    Boolean(
      c.summary?.startsWith('{') ||
      (c.keyConceptsJson && c.keyConceptsJson !== '[]') ||
      (c.definitionsJson && c.definitionsJson !== '[]')
    )
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={book.title}
        description={`Class ${book.className} • ${book.subject.name} • ${book.chapters.length} chapters (${analyzedCount} analyzed)`}
        breadcrumbs={[
          { label: 'Library', href: '/library' },
          { label: book.subject.name, href: '/library' },
          { label: book.title },
        ]}
      />

      {/* Primary Action Card: Open Full Book PDF */}
      <div className="rounded-2xl border-2 border-stone-900 bg-stone-900 p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-md bg-stone-800 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <BookOpen className="h-3.5 w-3.5" /> Full NCERT Textbook
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {book.title} (Complete Book)
          </h2>
          <p className="text-xs text-stone-300 max-w-xl">
            Read the entire original PDF textbook with page turners, search, and bookmarks. Individual chapter cards below focus 100% on UPSC Notes, Definitions, Map Work, and AI Analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href={`/library/${subject}/${bookId}/read`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-stone-900 shadow hover:bg-stone-100 transition cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            Open Book Reader
          </Link>

          <a
            href={GDRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-xs font-medium text-stone-200 hover:bg-stone-700 transition"
          >
            <ExternalLink className="h-4 w-4 text-stone-400" />
            Google Drive
          </a>
        </div>
      </div>

      {/* Chapters Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Chapter UPSC Notes & Analysis</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Click any chapter card to access full-width UPSC Prelims points, Mains dimensions, Map work, and definitions.
          </p>
        </div>
      </div>

      {/* Chapter Cards Grid */}
      <div className="grid gap-3.5 md:grid-cols-2">
        {book.chapters.map((chapter) => {
          const hasAnalysis = Boolean(
            chapter.summary?.startsWith('{') ||
            (chapter.keyConceptsJson && chapter.keyConceptsJson !== '[]') ||
            (chapter.definitionsJson && chapter.definitionsJson !== '[]')
          );

          return (
            <ChapterCard
              key={chapter.id}
              id={chapter.id}
              number={chapter.number}
              title={chapter.title}
              bookId={book.id}
              subjectSlug={subject}
              pyqCount={chapter.pyqs.length}
              hasAnalysis={hasAnalysis}
            />
          );
        })}
      </div>
    </div>
  );
}
