'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Loader2, 
  HelpCircle, 
  AlertTriangle, 
  Lightbulb, 
  BookOpen, 
  Clock,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

interface PYQInteractiveSolverProps {
  pyq: {
    id: number;
    year: number;
    examStage: string;
    paper: string;
    questionNumber: number | null;
    questionText: string;
    options: string[];
    correctAnswer: string | null;
    explanation: string | null;
    subjectArea: string | null;
    difficulty: string | null;
    directiveWord: string | null;
    questionType: string | null;
  };
}

export function PYQInteractiveSolver({ pyq }: PYQInteractiveSolverProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<{
    correctAnswer: string | null;
    isCorrect: boolean | null;
    explanation: string | null;
    optionBreakdown: Record<string, string>;
    subjectArea?: string | null;
    difficulty?: string | null;
    eliminationTrick?: string | null;
    attemptId?: number | null;
  } | null>(null);

  const [loggingError, setLoggingError] = useState(false);
  const [errorLogged, setErrorLogged] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState<string>('confused_concepts');

  const isMCQ = pyq.options && pyq.options.length > 0;

  const handleEvaluate = async (optionChoice?: string) => {
    const ans = optionChoice || selectedOption || textAnswer;
    if (!ans) return;

    setEvaluating(true);
    try {
      const res = await fetch('/api/evaluate-pyq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pyqId: pyq.id,
          userAnswer: ans,
          timeTakenSeconds: 30,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      }
    } catch (e) {
      console.error('Evaluation failed:', e);
    }
    setEvaluating(false);
  };

  const handleLogError = async () => {
    if (!result?.attemptId) return;
    setLoggingError(true);
    try {
      const res = await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: result.attemptId,
          errorType: selectedErrorType,
          description: `Mistake on ${pyq.examStage} ${pyq.year} ${pyq.paper} Q.${pyq.questionNumber || pyq.id}`,
        }),
      });
      if (res.ok) {
        setErrorLogged(true);
      }
    } catch (e) {
      console.error('Error logging failed:', e);
    }
    setLoggingError(false);
  };

  return (
    <div className="space-y-6">
      {/* Question Card */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {pyq.examStage} • {pyq.paper} • {pyq.year}
          </span>
          <div className="flex items-center gap-2">
            {pyq.subjectArea && (
              <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                {pyq.subjectArea}
              </span>
            )}
            {pyq.difficulty && (
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                {pyq.difficulty}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-base md:text-lg font-semibold text-stone-900 leading-relaxed whitespace-pre-wrap">
          {pyq.questionText}
        </h2>

        {/* Options for MCQ */}
        {isMCQ ? (
          <div className="mt-6 space-y-3">
            {pyq.options.map((opt, idx) => {
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedOption === optionLetter || selectedOption === opt;
              
              let cardStyle = 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 hover:border-stone-300 text-stone-800';
              let badgeStyle = 'bg-stone-200 text-stone-700';

              if (result) {
                const isCorrectOption = 
                  result.correctAnswer?.toUpperCase().includes(optionLetter) ||
                  result.correctAnswer?.toLowerCase() === opt.toLowerCase();
                
                if (isCorrectOption) {
                  cardStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium ring-1 ring-emerald-500';
                  badgeStyle = 'bg-emerald-600 text-white';
                } else if (isSelected && !result.isCorrect) {
                  cardStyle = 'border-rose-400 bg-rose-50/80 text-rose-950 ring-1 ring-rose-400';
                  badgeStyle = 'bg-rose-600 text-white';
                }
              } else if (isSelected) {
                cardStyle = 'border-stone-900 bg-stone-900 text-white shadow-xs';
                badgeStyle = 'bg-white text-stone-900';
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!result) {
                      setSelectedOption(optionLetter);
                      handleEvaluate(optionLetter);
                    }
                  }}
                  disabled={evaluating}
                  className={`w-full text-left flex items-start gap-3.5 rounded-xl border p-4 transition cursor-pointer ${cardStyle}`}
                >
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${badgeStyle}`}>
                    {optionLetter}
                  </span>
                  <span className="text-sm leading-relaxed flex-1">{opt}</span>
                  {result && (
                    result.correctAnswer?.toUpperCase().includes(optionLetter) ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : isSelected ? (
                      <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    ) : null
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Descriptive / Mains answer input */
          <div className="mt-6 space-y-3">
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Draft your main points or framework here..."
              rows={4}
              className="w-full rounded-xl border border-stone-300 p-4 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
            <button
              onClick={() => handleEvaluate()}
              disabled={evaluating || !textAnswer.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
            >
              {evaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Evaluate with UPSC Rubric
            </button>
          </div>
        )}

        {/* Loading State */}
        {evaluating && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-600">
            <Loader2 className="h-4 w-4 animate-spin text-stone-900" />
            <span>Consulting AI UPSC Knowledge Base for option-by-option breakdown...</span>
          </div>
        )}
      </section>

      {/* Result & Detailed Explanation Section */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status Banner */}
          <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
            result.isCorrect 
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950' 
              : 'border-rose-200 bg-rose-50 text-rose-950'
          }`}>
            {result.isCorrect ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-base font-bold">
                {result.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
              </h3>
              <p className="text-sm mt-1">
                Official / Verified Answer is Option <strong className="font-bold underline">{result.correctAnswer}</strong>.
              </p>
            </div>
          </div>

          {/* Option-by-Option Breakdown */}
          {result.optionBreakdown && Object.keys(result.optionBreakdown).length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-700">
                <HelpCircle className="h-4 w-4 text-blue-600" /> Option-by-Option Breakdown
              </h3>
              <div className="grid gap-3">
                {Object.entries(result.optionBreakdown).map(([optKey, explanationText]) => {
                  const isCorrectOpt = result.correctAnswer?.toUpperCase().includes(optKey);
                  return (
                    <div 
                      key={optKey} 
                      className={`rounded-xl border p-4 text-sm leading-relaxed ${
                        isCorrectOpt 
                          ? 'border-emerald-200 bg-emerald-50/50' 
                          : 'border-stone-200 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs ${
                          isCorrectOpt ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-800'
                        }`}>
                          {optKey}
                        </span>
                        <span className={isCorrectOpt ? 'text-emerald-900' : 'text-stone-700'}>
                          {isCorrectOpt ? 'Correct Option Explanation' : 'Why this is incorrect / trap'}
                        </span>
                      </div>
                      <p className="text-stone-700 text-xs md:text-sm pl-7">{explanationText}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Conceptual Explanation */}
          {result.explanation && (
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-700">
                <BookOpen className="h-4 w-4 text-stone-700" /> UPSC Conceptual Synthesis
              </h3>
              <p className="text-sm text-stone-800 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
                {result.explanation}
              </p>
            </section>
          )}

          {/* Elimination Strategy */}
          {result.eliminationTrick && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Lightbulb className="h-4 w-4 text-amber-600" /> Elimination Tip / Exam Strategy
              </h4>
              <p className="text-sm text-amber-950 leading-relaxed font-medium">
                {result.eliminationTrick}
              </p>
            </section>
          )}

          {/* Mistake Logging Prompt if Incorrect */}
          {!result.isCorrect && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Log this mistake to your Error Log?
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Track your patterns to ensure you don't repeat this in Prelims.
                </p>
              </div>

              {errorLogged ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  ✓ Logged to Error Log
                </span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedErrorType}
                    onChange={(e) => setSelectedErrorType(e.target.value)}
                    className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                  >
                    <option value="confused_concepts">Confused Concepts</option>
                    <option value="silly_mistake">Silly Mistake</option>
                    <option value="did_not_know">Did Not Know</option>
                    <option value="misread">Misread Question</option>
                    <option value="elimination_failure">Elimination Failure</option>
                    <option value="forgot">Forgot Revision</option>
                  </select>
                  <button
                    onClick={handleLogError}
                    disabled={loggingError}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                  >
                    {loggingError ? 'Logging...' : 'Save Error'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
