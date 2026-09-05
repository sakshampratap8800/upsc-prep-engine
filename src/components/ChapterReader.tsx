'use client';

import React, { useState } from 'react';
import { Sparkles, ExternalLink, Loader2, BookOpen, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { RelevanceBadge } from '@/components/RelevanceBadge';
import { PYQCard } from '@/components/PYQCard';

interface ChapterReaderProps {
  chapter: {
    id: number;
    number: number;
    title: string;
    content: string | null;
    summary: string | null;
    keyConceptsJson: string | null;
    definitionsJson: string | null;
    findOutQuestionsJson: string | null;
    book: {
      id: number;
      title: string;
      className: number;
      subject: {
        name: string;
        slug: string;
      };
    };
    topics: Array<{ id: number; name: string; paper: string }>;
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
    revisionItems: Array<{ id: number; title: string; priority: string }>;
  };
}

interface AIAnalysisResult {
  relevance?: string;
  prelimsFocus?: string[];
  mainsAngles?: string[];
  keyDefinitions?: Array<{ term: string; definition: string }>;
  highYieldSummary?: string[];
}

const GDRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1WM938D-obvqcgG1ubET5YfV6JWj58ZxJ?usp=drive_link';

export function ChapterReader({ chapter }: ChapterReaderProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialKeyConcepts: string[] = chapter.keyConceptsJson ? JSON.parse(chapter.keyConceptsJson) : [];
  const initialDefinitions: Array<{ term: string; definition: string }> = chapter.definitionsJson ? JSON.parse(chapter.definitionsJson) : [];
  const findOutQuestions: string[] = chapter.findOutQuestionsJson ? JSON.parse(chapter.findOutQuestionsJson) : [];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze chapter');
      }
      setAiAnalysis(data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error calling Gemini AI';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const keyConcepts = aiAnalysis?.prelimsFocus?.length ? aiAnalysis.prelimsFocus : initialKeyConcepts;
  const definitions = aiAnalysis?.keyDefinitions?.length ? aiAnalysis.keyDefinitions : initialDefinitions;

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 font-bold text-white text-sm">
            {chapter.number}
          </span>
          <div>
            <h1 className="text-lg font-bold text-stone-900">{chapter.title}</h1>
            <p className="text-xs text-stone-500">
              {chapter.book.subject.name} • Class {chapter.book.className} • {chapter.book.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Analyze with Gemini */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                Analyze with Gemini
              </>
            )}
          </button>

          {/* Open in Google Drive */}
          <a
            href={GDRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
            Open in Drive
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Inbuilt PDF Viewer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm h-[820px]">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-stone-500" />
              Inbuilt PDF Viewer (Streaming from Storage)
            </span>
            <span className="text-[11px] text-stone-400">Class {chapter.book.className} • {chapter.book.title}</span>
          </div>

          <div className="flex-1 bg-stone-100 relative">
            <iframe
              src={`/api/pdf/${chapter.book.id}`}
              className="w-full h-full border-none"
              title={`PDF Reader: ${chapter.title}`}
            />
          </div>
        </div>

        {/* Right / AI & UPSC Companion (5 cols) */}
        <div className="lg:col-span-5 space-y-6 h-[820px] overflow-y-auto pr-1">
          {/* AI Synthesis Box */}
          {aiAnalysis && (
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" /> Gemini 3.1 Flash Lite Notes
                </span>
                {aiAnalysis.relevance && (
                  <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                    {aiAnalysis.relevance}
                  </span>
                )}
              </div>

              {aiAnalysis.highYieldSummary && aiAnalysis.highYieldSummary.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">High-Yield Exam Takeaways</h3>
                  <ul className="mt-2 space-y-1.5">
                    {aiAnalysis.highYieldSummary.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-stone-800 leading-relaxed">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.mainsAngles && aiAnalysis.mainsAngles.length > 0 && (
                <div className="mt-4 pt-3 border-t border-indigo-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">Mains Analytical Dimensions</h3>
                  <ul className="mt-2 space-y-1.5">
                    {aiAnalysis.mainsAngles.map((angle, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-stone-800 leading-relaxed">
                        <ChevronRight className="h-3.5 w-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span>{angle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Syllabus Connection */}
          {chapter.topics.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">UPSC Syllabus Mappings</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {chapter.topics.map((t) => (
                  <span key={t.id} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                    {t.name} ({t.paper})
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Prelims Focus / Key Concepts */}
          {keyConcepts.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">Prelims Focus & Key Concepts</h2>
              <ul className="mt-3 space-y-2">
                {keyConcepts.map((concept, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-stone-700 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Important Definitions */}
          {definitions.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">Essential Definitions</h2>
              <dl className="mt-3 space-y-2.5">
                {definitions.map((def, i) => (
                  <div key={i} className="rounded-lg bg-stone-50 p-2.5 border border-stone-100">
                    <dt className="text-xs font-bold text-stone-800">{def.term}</dt>
                    <dd className="mt-1 text-xs text-stone-600 leading-relaxed">{def.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* NCERT Find Out Questions */}
          {findOutQuestions.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-stone-400" /> NCERT Thought Questions
              </h2>
              <ul className="mt-3 space-y-2">
                {findOutQuestions.map((q, i) => (
                  <li key={i} className="rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-xs text-stone-700 leading-relaxed">
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related PYQs */}
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Related PYQs {chapter.pyqs.length > 0 && `(${chapter.pyqs.length})`}
            </h2>
            {chapter.pyqs.length === 0 ? (
              <p className="mt-3 text-xs text-stone-500">
                No PYQs linked yet. (Batch mapping on standby per your schedule).
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {chapter.pyqs.map((pyq) => (
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

          {/* Revision Items */}
          {chapter.revisionItems.length > 0 && (
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">Revision Items</h2>
              <div className="mt-3 space-y-2">
                {chapter.revisionItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-stone-50 p-2.5 border border-stone-100">
                    <span className="text-xs text-stone-700 font-medium">{item.title}</span>
                    <RelevanceBadge level={item.priority} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
