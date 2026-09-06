'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { submitAnswer, logError } from './actions';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Clock,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────
interface Question {
  id: number;
  year: number;
  questionNumber: number | null;
  questionText: string;
  options: string[] | null; // parsed from optionsJson
  correctAnswer: string | null;
  explanation: string | null;
  difficulty: string | null;
}

interface QuestionState {
  selectedOption: string | null;
  textAnswer: string;
  isSubmitted: boolean;
  isCorrect: boolean | null;
  correctAnswer: string | null;
  explanation: string | null;
  attemptId: number | null;
}

interface PrelimsPracticeProps {
  questions: Question[];
  years: number[];
  selectedYear: number | null;
}

// ── Component ───────────────────────────────────────────────────────────
export default function PrelimsPractice({
  questions,
  years,
  selectedYear,
}: PrelimsPracticeProps) {
  const [current, setCurrent] = useState(0);
  const [states, setStates] = useState<QuestionState[]>(() =>
    questions.map(() => ({
      selectedOption: null,
      textAnswer: '',
      isSubmitted: false,
      isCorrect: null,
      correctAnswer: null,
      explanation: null,
      attemptId: null,
    }))
  );
  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Reset timer when question changes
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [current]);

  const q = questions[current];
  const state = states[current];
  const totalAnswered = states.filter((s) => s.isSubmitted).length;
  const totalCorrect = states.filter((s) => s.isCorrect === true).length;
  const progress = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  // ── Handlers ────────────────────────────────────────────────────────
  const updateState = useCallback(
    (index: number, patch: Partial<QuestionState>) => {
      setStates((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], ...patch };
        return copy;
      });
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!q) return;
    const answer = q.options ? state.selectedOption : state.textAnswer;
    if (!answer) return;

    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const result = await submitAnswer(q.id, answer, timeTaken);
      if (result.success) {
        updateState(current, {
          isSubmitted: true,
          isCorrect: result.score === 1,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
          attemptId: result.attemptId ?? null,
        });
      } else {
        // Log error if we have an attempt id
        console.error(result.error);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [q, state, current, updateState]);

  const handleReportError = useCallback(async () => {
    if (!state.attemptId) return;
    try {
      await logError(state.attemptId, 'wrong_answer', 'User reported incorrect answer key');
    } catch {
      // silently fail
    }
  }, [state.attemptId]);

  // ── Empty state ─────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-stone-700 dark:text-stone-300">
          No Prelims questions found.
        </p>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Try selecting a different year or import some PYQs first.
        </p>
      </div>
    );
  }

  // ── Summary screen ──────────────────────────────────────────────────
  if (showSummary) {
    const pct = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 text-center shadow-xs">
          <Trophy className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">
            Practice Complete!
          </h2>
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            Here&apos;s how you performed
          </p>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-stone-50 dark:bg-stone-800 p-4">
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalAnswered}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Attempted</p>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-950/40 p-4">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalCorrect}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Correct</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {totalAnswered - totalCorrect}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">Incorrect</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">{pct}%</div>
            <p className="text-sm text-stone-500 dark:text-stone-400">Score</p>
          </div>

          {/* Per-question breakdown */}
          <div className="mt-8 space-y-2 text-left">
            {questions.map((question, i) => {
              const s = states[i];
              return (
                <button
                  key={question.id}
                  onClick={() => { setShowSummary(false); setCurrent(i); }}
                  className="flex w-full items-center gap-3 rounded-lg border border-stone-100 dark:border-stone-800 px-4 py-2 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    s.isCorrect === true ? 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300' : s.isCorrect === false ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'}`}
                  >
                    {s.isCorrect === true ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : s.isCorrect === false ? (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </span>
                  <span className="flex-1 truncate text-sm text-stone-700 dark:text-stone-300">
                    Q{i + 1}. {question.questionText.slice(0, 80)}
                    {question.questionText.length > 80 ? '…' : ''}
                  </span>
                  <span className="text-xs text-stone-400">{question.year}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => setShowSummary(false)}
              className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
            >
              Review Answers
            </button>
            <a
              href={selectedYear ? `/practice/prelims?year=${selectedYear}` : '/practice/prelims'}
              className="rounded-lg bg-stone-900 dark:bg-stone-100 px-4 py-2 text-sm font-medium text-white dark:text-stone-900 transition-colors hover:bg-stone-800 dark:hover:bg-stone-200"
            >
              <RotateCcw className="mr-1.5 inline h-4 w-4" />
              New Session
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Main quiz view ──────────────────────────────────────────────────
  const hasOptions = q.options && q.options.length > 0;
  const canSubmit = hasOptions ? !!state.selectedOption : state.textAnswer.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Year filter */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/practice/prelims"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !selectedYear
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
        >
          All Years
        </a>
        {years.map((y) => (
          <a
            key={y}
            href={`/practice/prelims?year=${y}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedYear === y
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {y}
          </a>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span>
            {totalCorrect}/{totalAnswered} correct
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-stone-900 dark:bg-amber-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs transition-colors">
        {/* Meta */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-300">
            {q.year}
          </span>
          {q.questionNumber && (
            <span className="rounded bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-300">
              Q{q.questionNumber}
            </span>
          )}
          {q.difficulty && (
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                q.difficulty === 'Easy'
                  ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-850'
                  : q.difficulty === 'Hard'
                    ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-850'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-850'
              }`}
            >
              {q.difficulty}
            </span>
          )}
        </div>

        {/* Question text */}
        <p className="whitespace-pre-wrap text-stone-900 dark:text-stone-100 leading-relaxed font-medium">
          {q.questionText}
        </p>

        {/* Options or Text area */}
        {hasOptions ? (
          <div className="mt-5 space-y-2">
            {q.options!.map((opt, i) => {
              const isSelected = state.selectedOption === opt;
              const isCorrectOpt =
                state.isSubmitted &&
                state.correctAnswer &&
                opt.toLowerCase().startsWith(`(${state.correctAnswer.toLowerCase()})`)
                  ? true
                  : state.isSubmitted &&
                    state.correctAnswer &&
                    opt.toLowerCase().includes(state.correctAnswer.toLowerCase());

              let optClasses =
                'w-full rounded-xl border px-4 py-3 text-left text-sm transition-all cursor-pointer ';

              if (state.isSubmitted) {
                if (isCorrectOpt) {
                  optClasses +=
                    'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200 font-bold ';
                } else if (isSelected && !isCorrectOpt) {
                  optClasses += 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 ';
                } else {
                  optClasses += 'border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-400 dark:text-stone-500 ';
                }
              } else if (isSelected) {
                optClasses +=
                  'border-stone-900 dark:border-amber-400 bg-stone-50 dark:bg-amber-950/30 text-stone-900 dark:text-amber-200 ring-1 ring-stone-900 dark:ring-amber-400 font-semibold ';
              } else {
                optClasses +=
                  'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60 ';
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!state.isSubmitted) {
                      updateState(current, { selectedOption: opt });
                    }
                  }}
                  disabled={state.isSubmitted}
                  className={optClasses}
                >
                  <span className="flex items-center gap-3">
                    {state.isSubmitted && isCorrectOpt && (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                    )}
                    {state.isSubmitted && isSelected && !isCorrectOpt && (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <span>{opt}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <textarea
              value={state.textAnswer}
              onChange={(e) => {
                if (!state.isSubmitted) {
                  updateState(current, { textAnswer: e.target.value });
                }
              }}
              disabled={state.isSubmitted}
              placeholder="Write your answer here…"
              rows={6}
              className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-stone-400 dark:focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:bg-stone-50 dark:disabled:bg-stone-850"
            />
          </div>
        )}

        {/* Feedback after submission */}
        {state.isSubmitted && (
          <div
            className={`mt-4 rounded-xl p-4 ${
              state.isCorrect
                ? 'border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-950/40'
                : state.isCorrect === false
                  ? 'border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40'
                  : 'border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {state.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : state.isCorrect === false ? (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Clock className="h-5 w-5 text-stone-500 dark:text-stone-400" />
              )}
              <span
                className={`font-semibold text-sm ${
                  state.isCorrect
                    ? 'text-green-800 dark:text-green-200'
                    : state.isCorrect === false
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {state.isCorrect
                  ? 'Correct!'
                  : state.isCorrect === false
                    ? 'Incorrect'
                    : 'Answer recorded'}
              </span>
            </div>
            {state.correctAnswer && !state.isCorrect && (
              <p className="mt-2 text-sm text-stone-700 dark:text-stone-200">
                Correct answer: <strong className="text-stone-900 dark:text-white">{state.correctAnswer}</strong>
              </p>
            )}
            {state.explanation && (
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{state.explanation}</p>
            )}
            {state.isCorrect === false && (
              <button
                onClick={handleReportError}
                className="mt-3 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline cursor-pointer"
              >
                Report incorrect answer key
              </button>
            )}
          </div>
        )}

        {/* Submit button */}
        {!state.isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="mt-5 w-full rounded-xl bg-stone-900 dark:bg-stone-100 px-4 py-2.5 text-sm font-bold text-white dark:text-stone-900 transition-colors hover:bg-stone-800 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {submitting ? 'Submitting…' : 'Submit Answer'}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 transition-colors hover:bg-stone-50 dark:hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {/* Question dots */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {questions.map((_, i) => {
            const s = states[i];
            let dotClass = 'h-2.5 w-2.5 rounded-full transition-all cursor-pointer ';
            if (i === current) {
              dotClass += 'ring-2 ring-stone-400 dark:ring-amber-400 ring-offset-1 ';
            }
            if (s.isCorrect === true) {
              dotClass += 'bg-green-500';
            } else if (s.isCorrect === false) {
              dotClass += 'bg-red-500';
            } else if (s.isSubmitted) {
              dotClass += 'bg-stone-400 dark:bg-stone-600';
            } else {
              dotClass += 'bg-stone-200 dark:bg-stone-700';
            }
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={dotClass}
                title={`Question ${i + 1}`}
              />
            );
          })}
        </div>

        {current === questions.length - 1 ? (
          <button
            onClick={() => setShowSummary(true)}
            className="rounded-xl bg-stone-900 dark:bg-stone-100 px-4 py-2 text-sm font-bold text-white dark:text-stone-900 transition-colors hover:bg-stone-800 dark:hover:bg-white cursor-pointer"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 transition-colors hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
