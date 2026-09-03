'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Search, BookOpen, FileQuestion, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface SearchResults {
  chapters: Array<{ id: number; number: number; title: string; book: { id: number; title: string; subject: { slug: string } } }>;
  pyqs: Array<{ id: number; year: number; examStage: string; paper: string; questionText: string }>;
  topics: Array<{ id: number; name: string; paper: string }>;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="Search"
        description="Search across chapters, PYQs, syllabus topics, and concepts"
      />

      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for topics, concepts, questions..."
          className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {results && (
        <div className="mt-8 space-y-8">
          {/* Chapters */}
          {results.chapters.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900">
                <BookOpen className="h-5 w-5" /> Chapters ({results.chapters.length})
              </h2>
              <div className="space-y-2">
                {results.chapters.map((ch) => (
                  <Link key={ch.id} href={`/library/${ch.book.subject.slug}/${ch.book.id}/${ch.id}`}
                    className="block rounded-lg border border-stone-200 bg-white p-4 hover:bg-stone-50 transition-colors">
                    <p className="text-sm font-medium text-stone-800">Ch.{ch.number}: {ch.title}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{ch.book.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* PYQs */}
          {results.pyqs.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900">
                <FileQuestion className="h-5 w-5" /> PYQs ({results.pyqs.length})
              </h2>
              <div className="space-y-2">
                {results.pyqs.map((pyq) => (
                  <Link key={pyq.id} href={`/pyq/${pyq.id}`}
                    className="block rounded-lg border border-stone-200 bg-white p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-stone-700">{pyq.year}</span>
                      <span>\u2022</span><span>{pyq.examStage}</span>
                      <span>\u2022</span><span>{pyq.paper}</span>
                    </div>
                    <p className="mt-1 text-sm text-stone-700 line-clamp-2">{pyq.questionText}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Syllabus Topics */}
          {results.topics.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900">
                <GraduationCap className="h-5 w-5" /> Syllabus Topics ({results.topics.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.topics.map((t) => (
                  <span key={t.id} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                    {t.name} ({t.paper})
                  </span>
                ))}
              </div>
            </section>
          )}

          {results.chapters.length === 0 && results.pyqs.length === 0 && results.topics.length === 0 && (
            <p className="text-sm text-stone-500">No results found for "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}
