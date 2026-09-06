import { PageHeader } from '@/components/PageHeader';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Target, FileQuestion, PenLine, Trophy, Clock, Sparkles } from 'lucide-react';

export default async function PracticePage() {
  let prelimsCount = 0;
  let mainsCount = 0;
  let attemptsCount = 0;

  try {
    prelimsCount = await prisma.pYQ.count({ where: { examStage: 'Prelims' } });
    mainsCount = await prisma.pYQ.count({ where: { examStage: 'Mains' } });
    attemptsCount = await prisma.answerAttempt.count();
  } catch {
    // DB not ready
  }

  const modes = [
    {
      title: 'Full Mock Test Series',
      desc: 'Simulate full 100Q Prelims GS, 80Q CSAT, and Mains papers with official timer & negative marking',
      href: '/practice/test-series',
      icon: Trophy,
      featured: true,
      stats: 'Timed 2-Hour Mocks + AI Scorecard',
      tag: '⭐ Highly Recommended',
    },
    {
      title: 'Prelims MCQ Practice',
      desc: `Practice ${prelimsCount} Prelims MCQs topic/year-wise with instant evaluation`,
      href: '/practice/prelims',
      icon: Target,
      featured: false,
      stats: `${prelimsCount} questions available`,
    },
    {
      title: 'Mains Answer Writing',
      desc: `Practice ${mainsCount} Mains questions with structured evaluation rubric`,
      href: '/practice/mains',
      icon: PenLine,
      featured: false,
      stats: `${mainsCount} questions available`,
    },
    {
      title: 'PYQ Browser & Solver',
      desc: 'Browse all questions with option-by-option breakdowns & elimination traps',
      href: '/pyq',
      icon: FileQuestion,
      featured: false,
      stats: `${attemptsCount} attempts logged`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice & Evaluation Hub"
        description="Practice official UPSC questions, simulate authentic full-length timed mock tests, and diagnose conceptual weaknesses."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link 
              key={mode.href} 
              href={mode.href} 
              className={`rounded-2xl border p-6 transition-all hover:shadow-md ${
                mode.featured 
                  ? 'border-stone-900 dark:border-stone-700 bg-stone-900 dark:bg-stone-900 text-white hover:bg-stone-800 dark:hover:bg-stone-850 ring-2 ring-stone-900/10' 
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${mode.featured ? 'bg-stone-800 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                {mode.tag && (
                  <span className="rounded-full bg-amber-400 text-stone-950 font-bold px-3 py-1 text-[11px] shadow-xs">
                    {mode.tag}
                  </span>
                )}
              </div>

              <h3 className={`mt-4 text-lg font-bold ${mode.featured ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>
                {mode.title}
              </h3>
              <p className={`mt-1 text-sm leading-relaxed ${mode.featured ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                {mode.desc}
              </p>
              <p className={`mt-4 text-xs font-semibold ${mode.featured ? 'text-amber-300' : 'text-stone-400 dark:text-stone-500'}`}>
                {mode.stats}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
