'use client';

import React, { useState } from 'react';
import { AIModelSelector } from './AIModelSelector';
import { DEFAULT_AI_MODEL_ID, getAIModelConfig } from '@/lib/ai/models';
import {
  Sparkles,
  Loader2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  X,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface LearnThisTopicPanelProps {
  slugs: string[];
  topicTitle: string;
  sectionName: string;
  onClose?: () => void;
}

export function LearnThisTopicPanel({
  slugs,
  topicTitle,
  sectionName,
  onClose,
}: LearnThisTopicPanelProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_AI_MODEL_ID);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<any | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [customQuery, setCustomQuery] = useState<string>('');

  const fetchLesson = async (followUpType?: string, customQ?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/study/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slugs,
          modelId: selectedModelId,
          followUpType,
          customQuestion: customQ,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to generate APFC lesson.');
      }

      setLesson(json.data);
      setActiveStepTab(1);
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI Teacher');
    } finally {
      setLoading(false);
    }
  };

  const currentModelConfig = getAIModelConfig(selectedModelId);

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-lg transition-all space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 dark:bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-white dark:text-stone-900">
              <Sparkles className="h-3 w-3 text-amber-300 dark:text-amber-500" /> APFC AI Teacher
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {sectionName}
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{topicTitle}</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Model Selector Component */}
      <AIModelSelector
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
        disabled={loading}
      />

      {/* Trigger Button if no lesson generated yet */}
      {!lesson && !loading && (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-center">
          <Sparkles className="h-10 w-10 text-amber-500 mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Ready to Learn {topicTitle}?</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mt-1 mb-5">
            Click below to generate a focused, 6-step APFC lesson calibrated for this exact subtopic using {currentModelConfig.name}.
          </p>
          <button
            onClick={() => fetchLesson()}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 dark:bg-stone-100 px-6 py-3 text-xs font-bold text-white dark:text-stone-900 shadow hover:bg-stone-800 dark:hover:bg-stone-200 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300 dark:text-amber-600" /> Start APFC AI Lesson
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            Teaching {topicTitle} using {currentModelConfig.name}...
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Checking APFC syllabus boundaries, retrieving historical PYQs, and compiling distractor traps.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 p-4 text-xs text-red-700 dark:text-red-300">
          <p className="font-bold flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-4 w-4" /> Lesson Generation Error
          </p>
          <p>{error}</p>
          <button
            onClick={() => fetchLesson()}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 dark:text-red-200 underline cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry Lesson Generation
          </button>
        </div>
      )}

      {/* Generated 6-Step Interactive Lesson Display */}
      {lesson && !loading && (
        <div className="space-y-6">
          {/* Step Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-200 dark:border-stone-800 pb-2 scrollbar-none">
            {[
              { id: 1, label: '1. Overview', icon: BookOpen },
              { id: 2, label: '2. Core Concepts', icon: Layers },
              { id: 3, label: '3. Common Traps', icon: AlertTriangle },
              { id: 4, label: '4. PYQ Patterns', icon: FileText },
              { id: 5, label: '5. Practice Questions', icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStepTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStepTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Model Badge */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800">
            <span>Lesson Engine: <strong className="text-stone-900 dark:text-stone-100">{lesson.modelUsed || currentModelConfig.name}</strong></span>
            <button
              onClick={() => fetchLesson()}
              className="text-stone-700 dark:text-stone-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Re-generate
            </button>
          </div>

          {/* STEP 1: OVERVIEW */}
          {activeStepTab === 1 && (
            <div className="space-y-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/30 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-500" /> Step 1: Concise APFC Overview
              </h3>
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-normal">
                {lesson.step1Overview}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStepTab(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-200"
                >
                  Proceed to Core Concepts <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CORE CONCEPTS */}
          {activeStepTab === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" /> Step 2: Core Syllabus Concepts
              </h3>
              <div className="space-y-3">
                {lesson.step2CoreConcepts?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-2 shadow-2xs"
                  >
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 dark:bg-stone-100 text-[10px] font-bold text-white dark:text-stone-900">
                        {idx + 1}
                      </span>
                      {item.title}
                    </h4>
                    <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                      {item.explanation}
                    </p>
                    {item.mustKnowVsNiceToKnow && (
                      <p className="text-[11px] font-medium text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                        💡 {item.mustKnowVsNiceToKnow}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStepTab(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-200"
                >
                  Proceed to Common Traps <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMMON TRAPS */}
          {activeStepTab === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Step 3: Distractor Traps & Confusion Points
              </h3>
              <div className="space-y-3">
                {lesson.step3CommonTraps?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2"
                  >
                    <p className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      ⚠️ Trap: {item.trap}
                    </p>
                    <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed bg-white dark:bg-stone-900 p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <strong>Clarification:</strong> {item.clarification}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStepTab(4)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-200"
                >
                  Proceed to PYQ Patterns <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PYQ PATTERNS */}
          {activeStepTab === 4 && (
            <div className="space-y-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/30 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" /> Step 4: Historical UPSC PYQ Pattern Analysis
              </h3>
              <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                {lesson.step4PYQAnalysis}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStepTab(5)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-200"
                >
                  Proceed to Practice Questions <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PRACTICE QUESTIONS */}
          {activeStepTab === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-purple-500" /> Step 5: APFC-Level Practice Questions
              </h3>
              <div className="space-y-4">
                {lesson.step5PracticeQuestions?.map((q: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 shadow-2xs"
                  >
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-line">
                      Q{idx + 1}. {q.questionText}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt: string, oIdx: number) => (
                        <div
                          key={oIdx}
                          className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 font-medium"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200">
                      <p className="font-bold flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Correct Answer: {q.correctAnswer}
                      </p>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: INTERACTIVE FOLLOW-UP OPTIONS */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-amber-500" /> Step 6: Interactive Follow-Up Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              {lesson.step6InteractiveFollowUps?.map((actionLabel: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => fetchLesson(actionLabel)}
                  className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-900 transition cursor-pointer"
                >
                  {actionLabel}
                </button>
              ))}
            </div>

            {/* Custom Question input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Ask your AI teacher a specific doubt about this topic..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customQuery.trim()) {
                    fetchLesson('Custom Question', customQuery);
                    setCustomQuery('');
                  }
                }}
                className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100"
              />
              <button
                onClick={() => {
                  if (customQuery.trim()) {
                    fetchLesson('Custom Question', customQuery);
                    setCustomQuery('');
                  }
                }}
                className="rounded-xl bg-stone-900 dark:bg-stone-100 px-4 py-2 text-xs font-bold text-white dark:text-stone-900 transition hover:bg-stone-800 cursor-pointer shrink-0"
              >
                Ask Doubt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
