'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { 
  Search, 
  BookOpen, 
  FileQuestion, 
  GraduationCap, 
  Calendar, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Filter,
  X
} from 'lucide-react';
import Link from 'next/link';

interface SearchResults {
  chapters: Array<{
    id: number;
    number: number;
    title: string;
    book: {
      id: number;
      title: string;
      className: number;
      subject: { name: string; slug: string };
    };
  }>;
  pyqs: Array<{
    id: number;
    year: number;
    examStage: string;
    paper: string;
    questionNumber: number | null;
    questionText: string;
    subjectArea: string | null;
    difficulty: string | null;
  }>;
  topics: Array<{ id: number; name: string; paper: string; description: string | null }>;
  tasks: Array<{
    id: number;
    title: string;
    phase: string | null;
    timeAllocation: string | null;
    monthNumber: number | null;
    weekNumber: number | null;
    dayOfWeek: string | null;
    status: string;
  }>;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'chapters' | 'pyqs' | 'topics' | 'tasks'>('all');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    }
    setLoading(false);
  };

  // Search-as-you-type with 280ms debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSearch = (searchQuery?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const q = searchQuery !== undefined ? searchQuery : query;
    performSearch(q);
  };

  const quickPills = [
    'Drainage',
    'Inflation',
    'Fundamental Rights',
    'Indus Valley',
    'Monsoon',
    'HDI',
    'Judiciary',
    'Biodiversity'
  ];

  const totalResults = results
    ? (results.chapters?.length || 0) +
      (results.pyqs?.length || 0) +
      (results.topics?.length || 0) +
      (results.tasks?.length || 0)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Global Search"
        description="Search across 252 textbook chapters, 3,032 PYQs, UPSC syllabus topics, and timetable tasks in real-time."
      />

      {/* Search Input Box */}
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search concepts, NCERT terms, questions, or syllabus modules (live as you type)..."
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 pl-10 pr-10 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-stone-900 dark:focus:border-stone-100 focus:outline-none shadow-xs transition"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults(null);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 dark:bg-stone-100 px-6 py-3 text-sm font-bold text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 transition cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500 dark:text-stone-400">
          <span className="font-medium text-stone-400 dark:text-stone-500">Quick Searches:</span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              onClick={() => {
                setQuery(pill);
                handleSearch(pill);
              }}
              className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:border-stone-300 transition cursor-pointer"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-6 pt-4">
          {/* Result Filter Tabs */}
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 flex-wrap gap-2">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              Found {totalResults} matches
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: `All (${totalResults})` },
                { id: 'chapters', label: `Chapters (${results.chapters.length})` },
                { id: 'pyqs', label: `PYQs (${results.pyqs.length})` },
                { id: 'topics', label: `Syllabus (${results.topics.length})` },
                { id: 'tasks', label: `Timetable (${results.tasks.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Chapters Results */}
          {(activeFilter === 'all' || activeFilter === 'chapters') && results.chapters.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Textbook Chapters ({results.chapters.length})
              </h2>
              <div className="grid gap-2.5 md:grid-cols-2">
                {results.chapters.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/library/${ch.book.subject.slug}/${ch.book.id}/${ch.id}`}
                    className="group flex items-start justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-stone-400 dark:hover:border-stone-700 hover:shadow-xs transition"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/60">
                        {ch.book.subject.name} • Class {ch.book.className}
                      </span>
                      <h3 className="mt-1.5 text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Ch.{ch.number}: {ch.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{ch.book.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-700 dark:group-hover:text-stone-300 group-hover:translate-x-0.5 transition shrink-0 mt-2" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 2. PYQ Results */}
          {(activeFilter === 'all' || activeFilter === 'pyqs') && results.pyqs.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <FileQuestion className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Previous Year Questions ({results.pyqs.length})
              </h2>
              <div className="space-y-2.5">
                {results.pyqs.map((pyq) => (
                  <Link
                    key={pyq.id}
                    href={`/pyq/${pyq.id}`}
                    className="block rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-stone-400 dark:hover:border-stone-700 hover:shadow-xs transition"
                  >
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                      <span className="font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">{pyq.year}</span>
                      <span>•</span>
                      <span className="font-medium text-stone-700 dark:text-stone-300">{pyq.examStage}</span>
                      <span>•</span>
                      <span>{pyq.paper}</span>
                      {pyq.questionNumber && <span>• Q.{pyq.questionNumber}</span>}
                      {pyq.subjectArea && (
                        <span className="ml-auto rounded bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                          {pyq.subjectArea}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-stone-800 dark:text-stone-200 leading-relaxed line-clamp-3">
                      {pyq.questionText}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 3. Syllabus Topics Results */}
          {(activeFilter === 'all' || activeFilter === 'topics') && results.topics.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> UPSC Syllabus Topics ({results.topics.length})
              </h2>
              <div className="grid gap-2.5 md:grid-cols-2">
                {results.topics.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-1"
                  >
                    <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                      {t.paper}
                    </span>
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t.name}</h3>
                    {t.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">{t.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Timetable Tasks */}
          {(activeFilter === 'all' || activeFilter === 'tasks') && results.tasks.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Timetable Tasks ({results.tasks.length})
              </h2>
              <div className="space-y-2">
                {results.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/timetable"
                    className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                        Month {task.monthNumber || 1} • Week {task.weekNumber || 1} • {task.dayOfWeek || 'Scheduled'}
                      </p>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">{task.title}</h4>
                    </div>
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg shrink-0">
                      {task.timeAllocation || 'Daily Task'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {totalResults === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-700 mb-2" />
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No results found</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                We couldn't find any chapters, questions, or syllabus topics matching "{query}".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
