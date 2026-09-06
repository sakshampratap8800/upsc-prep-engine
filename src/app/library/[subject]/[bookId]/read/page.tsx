import { PageHeader } from '@/components/PageHeader';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { ExternalLink, BookOpen } from 'lucide-react';
import { getBookDriveInfo } from '@/lib/gdrive-map';

interface Props {
  params: Promise<{ subject: string; bookId: string }>;
}

const GDRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1WM938D-obvqcgG1ubET5YfV6JWj58ZxJ?usp=sharing';

export default async function ReadBookPage({ params }: Props) {
  const { subject, bookId } = await params;
  const id = parseInt(bookId, 10);
  if (isNaN(id)) notFound();

  const book = await prisma.book.findUnique({
    where: { id },
    include: { subject: true },
  });

  if (!book) notFound();

  const driveInfo = getBookDriveInfo(book.fileName);
  const pdfSrc = driveInfo?.previewUrl || `/api/pdf/${book.id}#toolbar=1&navpanes=0`;
  const directLink = driveInfo?.viewUrl || GDRIVE_FOLDER_URL;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Read: ${book.title}`}
        description={`Full NCERT Textbook Reader • Class ${book.className} • ${book.subject.name}`}
        breadcrumbs={[
          { label: 'Library', href: '/library' },
          { label: book.subject.name, href: '/library' },
          { label: book.title, href: `/library/${subject}/${bookId}` },
          { label: 'Full Book Reader' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 shadow-xs hover:bg-stone-50 dark:hover:bg-stone-700 transition cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              Pop-out Tab
            </a>
            <a
              href={GDRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 shadow-xs hover:bg-stone-50 dark:hover:bg-stone-700 transition cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              Open Drive
            </a>
          </div>
        }
      />

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs overflow-hidden h-[calc(100vh-180px)]">
        <iframe
          src={pdfSrc}
          className="w-full h-full border-none"
          title={`PDF Reader: ${book.title}`}
          allow="autoplay"
        />
      </div>
    </div>
  );
}
