import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import prisma from '@/lib/db';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default async function LibraryPage() {
  let subjects: Array<{
    id: number;
    name: string;
    slug: string;
    books: Array<{ id: number; title: string; className: number; totalChapters: number }>;
  }> = [];

  try {
    subjects = await prisma.subject.findMany({
      include: { books: { orderBy: { className: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  } catch {
    // DB not ready
  }

  return (
    <div>
      <PageHeader
        title="NCERT Library"
        description="Browse your study material organized by subject → class → book → chapter"
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books imported yet"
          description="Import your NCERT PDFs to start building your library."
          action={
            <Link href="/import" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
              Import NCERTs
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {subjects.map((subject) => (
            <div key={subject.id}>
              <h2 className="mb-4 text-lg font-bold text-stone-900">{subject.name}</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {subject.books.map((book) => (
                  <Link
                    key={book.id}
                    href={`/library/${subject.slug}/${book.id}`}
                    className="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 hover:bg-stone-50"
                  >
                    <p className="text-xs font-medium text-stone-500">Class {book.className}</p>
                    <h3 className="mt-1 font-semibold text-stone-900">{book.title}</h3>
                    <p className="mt-2 text-xs text-stone-500">{book.totalChapters} chapters</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
