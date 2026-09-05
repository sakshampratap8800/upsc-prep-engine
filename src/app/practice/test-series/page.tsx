'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { 
  Trophy, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw,
  Sparkles,
  BookOpen,
  Play
} from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: number;
  mockNumber: number;
  year: number;
  examStage: string;
  paper: string;
  questionText: string;
  options: string[];
  correctAnswer: string | null;
  explanation: string | null;
  subjectArea: string | null;
}

interface TestData {
  mode: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  marksPerCorrect: number;
  negativeMarks: number;
  questions: Question[];
}

export default function TestSeriesPage() {
  const [selectedMode, setSelectedMode] = useState<string>('prelims_gs1');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [detailedResults, setDetailedResults] = useState<Record<number, any>>({});
  const [filterResult, setFilterResult] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const testModes = [
    {
      id: 'prelims_gs1',
      name: 'Prelims GS Paper 1',
      desc: '100 Questions • 120 Minutes • +2.0 / -0.66 marks',
      badge: 'Full Mock',
      accent: 'border-blue-500 bg-blue-50 text-blue-900',
    },
    {
      id: 'prelims_csat',
      name: 'Prelims CSAT Paper 2',
      desc: '80 Questions • 120 Minutes • +2.5 / -0.83 marks (33% qualifying)',
      badge: 'CSAT Simulator',
      accent: 'border-amber-500 bg-amber-50 text-amber-900',
    },
    {
      id: 'mains_gs',
      name: 'Mains GS Paper (I-IV)',
      desc: '20 Questions • 180 Minutes • 250 Marks simulation',
      badge: 'Subjective Mock',
      accent: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    },
    {
      id: 'essay',
      name: 'Essay Paper',
      desc: 'Section A & Section B • 180 Minutes • 250 Marks',
      badge: 'Essay Simulator',
      accent: 'border-purple-500 bg-purple-50 text-purple-900',
    },
    {
      id: 'sociology',
      name: 'Sociology Optional Mock',
      desc: 'Paper 1 & Paper 2 Comprehensive questions • 180 Minutes',
      badge: 'Optional Simulator',
      accent: 'border-rose-500 bg-rose-50 text-rose-900',
    },
  ];

  const handleStartTest = async (modeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/test-series?mode=${modeId}`);
      const data = await res.json();
      if (data.success) {
        setTestData(data);
        setTimeLeft(data.durationMinutes * 60);
        setUserAnswers({});
        setCurrentIdx(0);
        setTestStarted(true);
        setTestCompleted(false);
        setDetailedResults({});
      }
    } catch (e) {
      console.error('Failed to start test:', e);
    }
    setLoading(false);
  };

  // Timer countdown
  useEffect(() => {
    if (testStarted && !testCompleted && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (testStarted && timeLeft === 0 && !testCompleted) {
      handleSubmitTest();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [testStarted, testCompleted, timeLeft]);

  const handleSelectOption = (questionId: number, optionLetter: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionLetter ? '' : optionLetter,
    }));
  };

  const handleSubmitTest = async () => {
    if (!testData) return;
    setTestCompleted(true);
    setIsEvaluating(true);

    const results: Record<number, any> = {};
    for (const q of testData.questions) {
      const ans = userAnswers[q.id];
      if (ans) {
        try {
          const res = await fetch('/api/evaluate-pyq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pyqId: q.id, userAnswer: ans }),
          });
          const evalData = await res.json();
          results[q.id] = evalData;
        } catch {
          results[q.id] = { isCorrect: false, correctAnswer: q.correctAnswer };
        }
      } else {
        results[q.id] = { isCorrect: null, unattempted: true, correctAnswer: q.correctAnswer, explanation: q.explanation };
      }
    }
    setDetailedResults(results);
    setIsEvaluating(false);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  // Calculate score
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  if (testData && testCompleted) {
    testData.questions.forEach((q) => {
      const res = detailedResults[q.id];
      if (res?.isCorrect === true) correctCount++;
      else if (res?.isCorrect === false) incorrectCount++;
      else unattemptedCount++;
    });
  }

  const rawScore = testData
    ? correctCount * testData.marksPerCorrect - incorrectCount * testData.negativeMarks
    : 0;
  const totalMarks = testData ? testData.totalQuestions * testData.marksPerCorrect : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="UPSC Mock Test Series Simulator"
        description="Simulate authentic examination hall conditions with timed full mocks, negative marking, and instant AI diagnostic scorecards."
        breadcrumbs={[
          { label: 'Practice', href: '/practice' },
          { label: 'Test Series' }
        ]}
      />

      {!testStarted ? (
        /* Mode Selection Screen */
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {testModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`text-left rounded-2xl border-2 p-6 transition-all cursor-pointer ${
                  selectedMode === mode.id
                    ? 'border-stone-900 bg-white shadow-md ring-2 ring-stone-900/10'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {mode.badge}
                  </span>
                  {selectedMode === mode.id && (
                    <span className="h-2.5 w-2.5 rounded-full bg-stone-900 animate-pulse" />
                  )}
                </div>
                <h3 className="mt-2 text-lg font-bold text-stone-900">{mode.name}</h3>
                <p className="mt-1 text-xs text-stone-500">{mode.desc}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-900 text-white p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Exam Mode</span>
              <h3 className="text-xl font-bold">
                {testModes.find((m) => m.id === selectedMode)?.name}
              </h3>
              <p className="text-sm text-stone-300">
                Questions are randomly sampled from the master repository across recent UPSC CSE exam cycles.
              </p>
            </div>

            <button
              onClick={() => handleStartTest(selectedMode)}
              disabled={loading}
              className="inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-stone-900 hover:bg-stone-100 disabled:opacity-50 transition cursor-pointer shadow-sm shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-stone-900" />}
              Start Timed Test
            </button>
          </div>
        </div>
      ) : !testCompleted ? (
        /* Active Test Taking Screen */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900">{testData?.title}</h3>
              <p className="text-xs text-stone-500">
                Question {currentIdx + 1} of {testData?.totalQuestions} • {Object.keys(userAnswers).filter(k => userAnswers[Number(k)]).length} Attempted
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-stone-100 px-3.5 py-2 font-mono text-sm font-bold text-stone-800">
                <Clock className="h-4 w-4 text-stone-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              <button
                onClick={handleSubmitTest}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
              >
                Submit Paper
              </button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2">
              Question Palette
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {testData?.questions.map((q, idx) => {
                const isAnswered = !!userAnswers[q.id];
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-stone-900 bg-stone-900 text-white'
                        : isAnswered
                        ? 'bg-blue-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Question View */}
          {testData && testData.questions[currentIdx] && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Question {currentIdx + 1} ({testData.questions[currentIdx].year} {testData.questions[currentIdx].paper})
                </span>
                {testData.questions[currentIdx].subjectArea && (
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                    {testData.questions[currentIdx].subjectArea}
                  </span>
                )}
              </div>

              <h2 className="text-base md:text-lg font-semibold text-stone-900 leading-relaxed whitespace-pre-wrap">
                {testData.questions[currentIdx].questionText}
              </h2>

              {testData.questions[currentIdx].options.length > 0 ? (
                <div className="space-y-3">
                  {testData.questions[currentIdx].options.map((opt, oIdx) => {
                    const optionLetter = String.fromCharCode(65 + oIdx);
                    const isSelected = userAnswers[testData.questions[currentIdx].id] === optionLetter;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(testData.questions[currentIdx].id, optionLetter)}
                        className={`w-full text-left flex items-start gap-3 rounded-xl border p-4 transition cursor-pointer ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                            : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 hover:border-stone-300 text-stone-800'
                        }`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            isSelected ? 'bg-white text-stone-900' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {optionLetter}
                        </span>
                        <span className="text-sm leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={userAnswers[testData.questions[currentIdx].id] || ''}
                  onChange={(e) =>
                    setUserAnswers((prev) => ({
                      ...prev,
                      [testData.questions[currentIdx].id]: e.target.value,
                    }))
                  }
                  rows={6}
                  placeholder="Draft your response here..."
                  className="w-full rounded-xl border border-stone-300 p-4 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <button
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </button>

                <button
                  onClick={() => setCurrentIdx((prev) => Math.min(testData.questions.length - 1, prev + 1))}
                  disabled={currentIdx === testData.questions.length - 1}
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results / Diagnostic Scorecard Screen */
        <div className="space-y-6">
          {/* Scorecard Hero */}
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-xs text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-2">
              <Trophy className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-stone-900">Scorecard: {testData?.title}</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <span className="text-xs font-bold text-stone-500 uppercase">Final Score</span>
                <p className="text-2xl font-black text-stone-900 mt-1">
                  {rawScore.toFixed(2)} <span className="text-xs text-stone-400 font-normal">/ {totalMarks}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <span className="text-xs font-bold text-emerald-800 uppercase">Correct</span>
                <p className="text-2xl font-black text-emerald-900 mt-1">{correctCount}</p>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <span className="text-xs font-bold text-rose-800 uppercase">Incorrect</span>
                <p className="text-2xl font-black text-rose-900 mt-1">{incorrectCount}</p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <span className="text-xs font-bold text-stone-500 uppercase">Skipped</span>
                <p className="text-2xl font-black text-stone-700 mt-1">{unattemptedCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setTestStarted(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs font-bold text-white hover:bg-stone-800 transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> Retake or Choose Another Mock
              </button>
            </div>
          </div>

          {/* Detailed Question Review Tabs */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-stone-900">Question-by-Question Diagnostic Review</h3>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: `All (${testData?.questions.length})` },
                { id: 'correct', label: `Correct (${correctCount})` },
                { id: 'incorrect', label: `Incorrect (${incorrectCount})` },
                { id: 'unattempted', label: `Skipped (${unattemptedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterResult(tab.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    filterResult === tab.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtered Questions List */}
          <div className="space-y-4">
            {testData?.questions
              .filter((q) => {
                const res = detailedResults[q.id];
                if (filterResult === 'correct') return res?.isCorrect === true;
                if (filterResult === 'incorrect') return res?.isCorrect === false;
                if (filterResult === 'unattempted') return !userAnswers[q.id];
                return true;
              })
              .map((q) => {
                const res = detailedResults[q.id];
                const userChoice = userAnswers[q.id];
                const isCorrect = res?.isCorrect === true;
                const isIncorrect = res?.isCorrect === false;

                return (
                  <div key={q.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-500">
                        Q.{q.mockNumber} • {q.year} {q.paper}
                      </span>
                      <div className="flex items-center gap-2">
                        {isCorrect && (
                          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+{testData.marksPerCorrect})
                          </span>
                        )}
                        {isIncorrect && (
                          <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Incorrect (-{testData.negativeMarks})
                          </span>
                        )}
                        {!userChoice && (
                          <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                            Skipped
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-stone-900 leading-relaxed whitespace-pre-wrap">
                      {q.questionText}
                    </p>

                    {/* Options list */}
                    {q.options.length > 0 && (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const optionLetter = String.fromCharCode(65 + oIdx);
                          const isUserPicked = userChoice === optionLetter;
                          const isOfficialCorrect = res?.correctAnswer?.toUpperCase().includes(optionLetter);

                          let borderStyle = 'border-stone-100 bg-stone-50 text-stone-700';
                          if (isOfficialCorrect) {
                            borderStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                          } else if (isUserPicked && isIncorrect) {
                            borderStyle = 'border-rose-400 bg-rose-50 text-rose-950';
                          }

                          return (
                            <div key={oIdx} className={`rounded-xl border p-3 text-xs flex items-center gap-2.5 ${borderStyle}`}>
                              <span className="font-bold">{optionLetter})</span>
                              <span className="flex-1">{opt}</span>
                              {isOfficialCorrect && <span className="text-[10px] uppercase font-bold text-emerald-700">Correct Key</span>}
                              {isUserPicked && !isOfficialCorrect && <span className="text-[10px] uppercase font-bold text-rose-600">Your Choice</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {(res?.explanation || q.explanation) && (
                      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-700 leading-relaxed">
                        <strong className="text-stone-900 block mb-1">Conceptual Breakdown:</strong>
                        {res?.explanation || q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
