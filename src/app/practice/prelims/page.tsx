import { PageHeader } from '@/components/PageHeader';
import prisma from '@/lib/db';
import PrelimsPractice from './PrelimsPractice';

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function PrelimsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const yearFilter = params.year ? parseInt(params.year, 10) : null;

  let questions: {
    id: number;
    year: number;
    questionNumber: number | null;
    questionText: string;
    options: string[] | null;
    correctAnswer: string | null;
    explanation: string | null;
    difficulty: string | null;
  }[] = [];

  let years: number[] = [];

  try {
    // Get available years
    const yearResults = await prisma.pYQ.findMany({
      where: { examStage: 'Prelims', paper: 'Paper 1 (GS)' },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });
    years = yearResults.map((r) => r.year);

    // Build filter
    const where = {
      examStage: 'Prelims' as const,
      paper: 'Paper 1 (GS)' as const,
      ...(yearFilter ? { year: yearFilter } : {}),
    };

    // Fetch total count for this filter
    const total = await prisma.pYQ.count({ where });

    // Get 20 random questions by picking random offsets
    const limit = Math.min(20, total);
    const offsets = new Set<number>();
    while (offsets.size < limit && offsets.size < total) {
      offsets.add(Math.floor(Math.random() * total));
    }

    const pyqs = await Promise.all(
      Array.from(offsets).map((offset) =>
        prisma.pYQ.findMany({
          where,
          skip: offset,
          take: 1,
          select: {
            id: true,
            year: true,
            questionNumber: true,
            questionText: true,
            optionsJson: true,
            correctAnswer: true,
            explanation: true,
            difficulty: true,
          },
        })
      )
    );

    questions = pyqs
      .flat()
      .map((pyq) => {
        let options: string[] | null = null;
        if (pyq.optionsJson) {
          try {
            const parsed = JSON.parse(pyq.optionsJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              options = parsed;
            }
          } catch {
            // invalid JSON, leave as null
          }
        }
        return {
          id: pyq.id,
          year: pyq.year,
          questionNumber: pyq.questionNumber,
          questionText: pyq.questionText,
          options,
          correctAnswer: pyq.correctAnswer,
          explanation: pyq.explanation,
          difficulty: pyq.difficulty,
        };
      })
      // Shuffle the result order
      .sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Failed to fetch Prelims questions:', error);
  }

  return (
    <div>
      <PageHeader
        title="Prelims Practice"
        description="Practice Prelims MCQs from actual UPSC papers. Select an option and check your answer."
        breadcrumbs={[
          { label: 'Practice', href: '/practice' },
          { label: 'Prelims' },
        ]}
      />

      <PrelimsPractice
        questions={questions}
        years={years}
        selectedYear={yearFilter}
      />
    </div>
  );
}
