import { PageHeader } from '@/components/PageHeader';
import { ChapterReader } from '@/components/ChapterReader';
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

      <ChapterReader chapter={chapter} />
    </div>
  );
}
