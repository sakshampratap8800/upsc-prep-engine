'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Loader2, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle,
  MapPin,
  PenTool,
  BookmarkCheck,
  RotateCcw,
  Layers,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { RelevanceBadge } from '@/components/RelevanceBadge';
import { PYQCard } from '@/components/PYQCard';
import Link from 'next/link';

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

interface MainsAngleItem {
  question?: string;
  framework?: string;
}

interface SavedSummaryObject {
  highYieldSummary?: string[];
  mainsAngles?: Array<string | MainsAngleItem>;
  caseStudiesAndData?: string[];
  mapWork?: string[];
  diagramsToDraw?: string[];
  relevance?: string;
  modelUsed?: string;
}

const GDRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1WM938D-obvqcgG1ubET5YfV6JWj58ZxJ?usp=drive_link';

export function ChapterReader({ chapter }: ChapterReaderProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let savedSummaryObj: SavedSummaryObject | null = null;
  if (chapter.summary) {
    try {
      if (chapter.summary.startsWith('{')) {
        savedSummaryObj = JSON.parse(chapter.summary);
      }
    } catch {
      savedSummaryObj = null;
    }
  }

  const [aiData, setAiData] = useState<SavedSummaryObject | null>(savedSummaryObj);
  const [keyConcepts, setKeyConcepts] = useState<string[]>(
    chapter.keyConceptsJson ? JSON.parse(chapter.keyConceptsJson) : []
  );
  const [definitions, setDefinitions] = useState<Array<{ term: string; definition: string }>>(
    chapter.definitionsJson ? JSON.parse(chapter.definitionsJson) : []
  );

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

      setAiData({
        highYieldSummary: data.data.highYieldSummary || [],
        mainsAngles: data.data.mainsAngles || [],
        caseStudiesAndData: data.data.caseStudiesAndData || [],
        mapWork: data.data.mapWork || [],
        diagramsToDraw: data.data.diagramsToDraw || [],
        relevance: data.data.relevance || 'GS / Prelims',
        modelUsed: data.data.modelUsed || 'Gemini 3.8 Flash'
      });

      if (data.data.prelimsFocus) setKeyConcepts(data.data.prelimsFocus);
      if (data.data.keyDefinitions) setDefinitions(data.data.keyDefinitions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error calling Gemini AI';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const hasSavedNotes = Boolean(aiData || (keyConcepts && keyConcepts.length > 0) || (definitions && definitions.length > 0));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 font-bold text-white text-lg shadow-sm">
            {chapter.number}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-stone-900">{chapter.title}</h1>
              {hasSavedNotes && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <BookmarkCheck className="h-3.5 w-3.5" /> Saved in Database
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {chapter.book.subject.name} • Class {chapter.book.className} • {chapter.book.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Read in Full Book Reader */}
          <Link
            href={`/library/${chapter.book.subject.slug}/${chapter.book.id}/read`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-sm"
          >
            <BookOpen className="h-4 w-4 text-stone-600" />
            Open Full Book
          </Link>

          {/* Analyze / Re-analyze with Gemini */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                Analyzing (Gemini 3.8 Flash)...
              </>
            ) : hasSavedNotes ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 text-stone-300" />
                Re-Analyze with Gemini 3.8 Flash
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                Analyze with Gemini 3.8 Flash
              </>
            )}
          </button>

          {/* Open in Google Drive */}
          <a
            href={GDRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
            Drive
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Full-Width UPSC Content Study Deck */}
      <div className="space-y-6">
        {/* AI UPSC Synthesis Card */}
        {aiData && (
          <div className="space-y-6">
            {/* High-Yield Prelims Takeaways */}
            {aiData.highYieldSummary && aiData.highYieldSummary.length > 0 && (
              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" /> High-Yield UPSC Takeaways
                  </span>
                  {aiData.relevance && (
                    <span className="text-xs font-bold text-indigo-900 bg-indigo-100/90 px-3 py-1 rounded-lg border border-indigo-200">
                      {aiData.relevance}
                    </span>
                  )}
                </div>
                <ul className="mt-4 space-y-3">
                  {aiData.highYieldSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-stone-800 leading-relaxed bg-white/80 rounded-xl p-3.5 border border-indigo-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Specific Case Studies & Statistical Tables */}
            {aiData.caseStudiesAndData && aiData.caseStudiesAndData.length > 0 && (
              <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-rose-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-rose-600" /> NCERT Data Tables & Real-World Case Studies
                </h2>
                <ul className="mt-4 space-y-3">
                  {aiData.caseStudiesAndData.map((item, idx) => (
                    <li key={idx} className="rounded-xl bg-white border border-rose-100 p-4 text-sm text-stone-800 leading-relaxed shadow-2xs">
                      {typeof item === 'string' ? item : JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Mains Analytical Dimensions */}
            {aiData.mainsAngles && aiData.mainsAngles.length > 0 && (
              <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-indigo-600" /> Mains Analytical Dimensions & Frameworks
                </h2>
                <ul className="mt-4 space-y-4">
                  {aiData.mainsAngles.map((item, idx) => {
                    if (typeof item === 'object' && item !== null) {
                      return (
                        <li key={idx} className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm leading-relaxed space-y-2">
                          {item.question && (
                            <p className="font-bold text-stone-900 text-base">Q: {item.question}</p>
                          )}
                          {item.framework && (
                            <div className="text-stone-700 pl-3.5 border-l-3 border-indigo-500 bg-white p-3 rounded-r-lg border border-stone-100">
                              <p className="text-xs uppercase tracking-wider font-bold text-indigo-900 mb-1">Answer Framework & Value-Add Points:</p>
                              <p className="text-xs text-stone-700 leading-relaxed">{item.framework}</p>
                            </div>
                          )}
                        </li>
                      );
                    }
                    return (
                      <li key={idx} className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-800 leading-relaxed">
                        {String(item)}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* UPSC Map Work & Atlas Locations */}
            {aiData.mapWork && aiData.mapWork.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-600" /> Required UPSC Map Work & Atlas Pointers
                </h2>
                <p className="mt-1 text-xs text-amber-800">
                  Locate, trace, and mark these critical geographic coordinates/sites on your Atlas:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {aiData.mapWork.map((loc, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-amber-950 font-medium bg-white/90 p-3 rounded-xl border border-amber-100">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-600 flex-shrink-0" />
                      <span>{typeof loc === 'string' ? loc : JSON.stringify(loc)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Essential Mains Diagrams & Flowcharts */}
            {aiData.diagramsToDraw && aiData.diagramsToDraw.length > 0 && (
              <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-teal-900 flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-teal-600" /> Diagrams & Flowcharts for Mains Answer Writing
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {aiData.diagramsToDraw.map((diag, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-teal-950 font-medium bg-white/90 p-3 rounded-xl border border-teal-100">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-teal-600 flex-shrink-0" />
                      <span>{typeof diag === 'string' ? diag : JSON.stringify(diag)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Prelims Focus / Comprehensive Concepts */}
        {keyConcepts.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" /> Prelims High-Yield Explanations & Traps
            </h2>
            <ul className="mt-4 space-y-3">
              {keyConcepts.map((concept, i) => (
                <li key={i} className="rounded-xl bg-stone-50 border border-stone-100 p-3.5 text-sm text-stone-800 leading-relaxed">
                  {typeof concept === 'string' ? concept : JSON.stringify(concept)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Essential Definitions */}
        {definitions.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Essential Definitions & Formulas</h2>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              {definitions.map((def, i) => (
                <div key={i} className="rounded-xl bg-stone-50 p-3.5 border border-stone-100">
                  <dt className="text-sm font-bold text-stone-900">{def.term}</dt>
                  <dd className="mt-1 text-xs text-stone-600 leading-relaxed">{def.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Syllabus Connection */}
        {chapter.topics.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">UPSC Syllabus Mappings</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {chapter.topics.map((t) => (
                <span key={t.id} className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100">
                  {t.name} ({t.paper})
                </span>
              ))}
            </div>
          </section>
        )}

        {/* NCERT Find Out Questions */}
        {findOutQuestions.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-stone-400" /> NCERT Thought Questions
            </h2>
            <ul className="mt-3 space-y-2.5">
              {findOutQuestions.map((q, i) => (
                <li key={i} className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs text-stone-700 leading-relaxed">
                  {typeof q === 'string' ? q : JSON.stringify(q)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related PYQs */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
            Related PYQs {chapter.pyqs.length > 0 && `(${chapter.pyqs.length})`}
          </h2>
          {chapter.pyqs.length === 0 ? (
            <p className="mt-3 text-xs text-stone-500">
              No PYQs linked yet. (Batch mapping on standby per your schedule).
            </p>
          ) : (
            <div className="mt-3 space-y-3">
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

        {/* Empty state prompt */}
        {!hasSavedNotes && (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-amber-500 mb-3" />
            <h3 className="text-base font-bold text-stone-800">No UPSC Notes Generated Yet</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Click <strong>"Analyze with Gemini 3.8 Flash"</strong> above to extract deep Prelims takeaways, exact definitions & differences, Case Studies, Mains dimensions, and Atlas Map locations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
