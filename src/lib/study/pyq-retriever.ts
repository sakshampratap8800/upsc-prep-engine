import prisma from '@/lib/db';

export interface RetrievedPYQ {
  id: number;
  year: number;
  examStage: string;
  paper: string;
  questionNumber: number | null;
  questionText: string;
  options: string[];
  correctAnswer: string | null;
  explanation: string | null;
}

export async function getRelevantPYQsForTopic(
  keywords: string[],
  sectionSlug?: string,
  limit: number = 4
): Promise<RetrievedPYQ[]> {
  try {
    if (!keywords || keywords.length === 0) {
      const raw = await prisma.pYQ.findMany({
        where: { examStage: { in: ['EPFO APFC', 'EPFO EO/AO'] } },
        take: limit,
        orderBy: { year: 'desc' }
      });
      return formatPYQs(raw);
    }

    // Build OR condition across keywords for questionText and subjectArea
    const conditions = keywords.map(kw => ({
      questionText: { contains: kw }
    }));

    const raw = await prisma.pYQ.findMany({
      where: {
        examStage: { in: ['EPFO APFC', 'EPFO EO/AO'] },
        OR: conditions
      },
      take: limit,
      orderBy: { year: 'desc' }
    });

    if (raw.length === 0) {
      // Fallback: search without OR condition
      const fallback = await prisma.pYQ.findMany({
        where: { examStage: { in: ['EPFO APFC', 'EPFO EO/AO'] } },
        take: limit,
        orderBy: { year: 'desc' }
      });
      return formatPYQs(fallback);
    }

    return formatPYQs(raw);
  } catch (error) {
    console.error('Error in getRelevantPYQsForTopic:', error);
    return [];
  }
}

function formatPYQs(raw: any[]): RetrievedPYQ[] {
  return raw.map(q => ({
    id: q.id,
    year: q.year,
    examStage: q.examStage,
    paper: q.paper,
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    options: q.optionsJson ? JSON.parse(q.optionsJson) : [],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation
  }));
}
