import { PageHeader } from '@/components/PageHeader';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Target, FileQuestion, PenLine } from 'lucide-react';

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
      title: 'Prelims Practice',
      desc: `Practice ${prelimsCount} Prelims MCQs from actual UPSC papers`,
      href: '/practice/prelims',
      icon: Target,
      stats: `${prelimsCount} questions available`,
    },
    {
      title: 'Mains Answer Writing',
      desc: `Practice ${mainsCount} Mains questions with structured evaluation`,
      href: '/practice/mains',
      icon: PenLine,
      stats: `${mainsCount} questions available`,
    },
    {
      title: 'PYQ Deep Dive',
      desc: 'Analyze PYQs by topic, year, or exam stage',
      href: '/pyq',
      icon: FileQuestion,
      stats: `${attemptsCount} attempts so far`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Practice"
        description="Practice with actual UPSC PYQs. Track your performance and identify weak areas."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.href} href={mode.href} className="rounded-xl border border-stone-200 bg-white p-6 transition-colors hover:border-stone-300 hover:bg-stone-50">
              <Icon className="h-8 w-8 text-stone-600" />
              <h3 className="mt-4 text-lg font-bold text-stone-900">{mode.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{mode.desc}</p>
              <p className="mt-3 text-xs font-medium text-stone-400">{mode.stats}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
