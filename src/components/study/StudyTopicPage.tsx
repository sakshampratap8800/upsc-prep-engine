'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LearnThisTopicPanel } from './LearnThisTopicPanel';
import {
  ChevronRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  HelpCircle,
  Layers,
  ArrowLeft,
  FileText
} from 'lucide-react';

interface StudyTopicPageProps {
  slugs: string[];
  title: string;
  oneLiner: string;
  sectionName: string;
  breadcrumb: Array<{ label: string; href: string }>;
  keyConcepts?: string[];
  importantPoints?: string[];
  pyqKeywords?: string[];
  subtopicsList?: Array<{ title: string; fullPath: string; oneLiner: string }>;
  pyqs?: Array<{
    id: number;
    year: number;
    examStage: string;
    paper: string;
    questionNumber?: number | null;
    questionText: string;
    options: string[];
    correctAnswer: string | null;
    explanation: string | null;
  }>;
}

export function StudyTopicPage({
  slugs,
  title,
  oneLiner,
  sectionName,
  breadcrumb,
  keyConcepts = [],
  importantPoints = [],
  pyqKeywords = [],
  subtopicsList = [],
  pyqs = [],
}: StudyTopicPageProps) {
  const [showAIPanel, setShowAIPanel] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 overflow-x-auto scrollbar-none">
        {breadcrumb.map((crumb, i) => (
          <React.Fragment key={crumb.href || i}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-stone-900 dark:hover:text-stone-100 transition whitespace-nowrap"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Hero Header & Prominent AI "Learn This Topic" Button */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs transition-colors space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-xs font-bold text-stone-700 dark:text-stone-300">
              <BookOpen className="h-3.5 w-3.5 text-amber-500" /> {sectionName}
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium pt-1">
              {oneLiner}
            </p>
          </div>

          {/* Prominent Learn This Topic AI Button */}
          <button
            onClick={() => setShowAIPanel(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 dark:bg-stone-100 px-5 py-3 text-xs font-bold text-white dark:text-stone-900 shadow-md hover:bg-stone-800 dark:hover:bg-stone-200 transition cursor-pointer shrink-0"
          >
            <Sparkles className="h-4 w-4 text-amber-300 dark:text-amber-600 animate-pulse" />
            Learn This Topic (AI Teacher)
          </button>
        </div>

        {/* Action Tags */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400">
          <span>Target: <strong>EPFO APFC 2026</strong></span>
          <span>•</span>
          <span>Topic-Level RAG Context Active</span>
          <span>•</span>
          <span>Model: <strong>Nemotron 3.5 Lightning 30B / 120B</strong></span>
        </div>
      </div>

      {/* AI Teacher Panel (Opens on Click) */}
      {showAIPanel && (
        <LearnThisTopicPanel
          slugs={slugs}
          topicTitle={title}
          sectionName={sectionName}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* Subtopics Listing (If Section or Topic Level) */}
      {subtopicsList && subtopicsList.length > 0 && (
        <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" /> Subtopics in {title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subtopicsList.map((st) => (
              <Link
                key={st.fullPath}
                href={st.fullPath}
                className="group flex flex-col justify-between p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition shadow-2xs"
              >
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition flex items-center justify-between">
                    <span>{st.title}</span>
                    <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition shrink-0" />
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                    {st.oneLiner}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 1: TOPIC OVERVIEW */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-500" /> Topic Overview
        </h2>
        <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
          {oneLiner}
        </p>
      </section>

      {/* SECTION 2: KEY CONCEPTS */}
      {keyConcepts && keyConcepts.length > 0 && (
        <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" /> Key Syllabus Concepts
          </h2>
          <ul className="space-y-2.5">
            {keyConcepts.map((concept, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-stone-800 dark:text-stone-200 leading-relaxed p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* SECTION 3: IMPORTANT POINTS */}
      {importantPoints && importantPoints.length > 0 && (
        <section className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" /> High-Yield Important Points & Rules
          </h2>
          <ul className="space-y-2.5">
            {importantPoints.map((pt, idx) => (
              <li
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200 leading-relaxed border border-amber-200/60 dark:border-amber-900/40 shadow-2xs"
              >
                💡 {pt}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* SECTION 4: HISTORICAL PYQ RELEVANCE */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-amber-500" /> Historical UPSC EPFO PYQ Relevance
          </h2>
          <span className="text-[11px] text-stone-500 font-semibold">
            {pyqs.length} Matched PYQs
          </span>
        </div>

        {pyqs && pyqs.length > 0 ? (
          <div className="space-y-3">
            {pyqs.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500">
                  <span className="text-stone-900 dark:text-stone-100">{q.year}</span>
                  <span>•</span>
                  <span>{q.examStage}</span>
                  <span>•</span>
                  <span>{q.paper}</span>
                  {q.questionNumber && <span>• Q.{q.questionNumber}</span>}
                </div>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                  {q.questionText}
                </p>
                {q.correctAnswer && (
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Correct Answer: {q.correctAnswer}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500 dark:text-stone-400 italic">
            No exact historical PYQs retrieved for this subtopic keywords. Use "Learn This Topic" to get AI-generated APFC practice questions.
          </p>
        )}
      </section>

      {/* Bottom CTA Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-900 text-white p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold">Ready to practice this subtopic?</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Launch the interactive AI teacher or solve full mock tests.
          </p>
        </div>
        <button
          onClick={() => setShowAIPanel(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-stone-950 px-5 py-2.5 text-xs font-bold shadow hover:bg-amber-300 transition cursor-pointer"
        >
          <Sparkles className="h-4 w-4" /> Start AI Lesson
        </button>
      </div>
    </div>
  );
}
