import { PageHeader } from '@/components/PageHeader';
import { ChapterCard } from '@/components/ChapterCard';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ subject: string; bookId: string }>;
}

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

  return (
    <div>
      <PageHeader
        title={book.title}
        description={`Class ${book.className} • ${book.subject.name} • ${book.chapters.length} chapters`}
        breadcrumbs={[
          { label: 'Library', href: '/library' },
          { label: book.subject.name, href: '/library' },
          { label: book.title },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {book.chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            id={chapter.id}
            number={chapter.number}
            title={chapter.title}
            bookId={book.id}
            subjectSlug={subject}
            pyqCount={chapter.pyqs.length}
          />
        ))}
      </div>
    </div>
  );
}
