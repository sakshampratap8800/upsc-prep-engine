import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'prelims_gs1'; // prelims_gs1 | prelims_csat | mains_gs | essay | sociology

    let questions: any[] = [];
    let title = '';
    let totalQuestions = 100;
    let durationMinutes = 120;
    let marksPerCorrect = 2;
    let negativeMarks = 0.66;

    if (mode === 'prelims_gs1') {
      title = 'UPSC Prelims GS Paper 1 Full Mock Simulation';
      totalQuestions = 100;
      durationMinutes = 120;
      marksPerCorrect = 2.0;
      negativeMarks = 0.66;

      // Query real Prelims GS Paper 1 questions
      const count = await prisma.pYQ.count({
        where: { examStage: 'Prelims', paper: { contains: 'Paper 1' } },
      });

      const takeCount = Math.min(100, count);
      // Fetch random distribution
      const raw = await prisma.pYQ.findMany({
        where: { examStage: 'Prelims', paper: { contains: 'Paper 1' } },
        take: 150,
      });

      // Shuffle
      questions = raw.sort(() => Math.random() - 0.5).slice(0, takeCount);
    } else if (mode === 'prelims_csat') {
      title = 'UPSC Prelims CSAT Paper 2 Full Mock Simulation';
      totalQuestions = 80;
      durationMinutes = 120;
      marksPerCorrect = 2.5;
      negativeMarks = 0.83;

      const raw = await prisma.pYQ.findMany({
        where: { examStage: 'Prelims', paper: { contains: 'Paper 2' } },
        take: 120,
      });

      questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(80, raw.length));
    } else if (mode === 'mains_gs') {
      title = 'UPSC Mains GS Full Simulation Paper (20 Questions)';
      totalQuestions = 20;
      durationMinutes = 180;
      marksPerCorrect = 12.5;
      negativeMarks = 0;

      const raw = await prisma.pYQ.findMany({
        where: { examStage: 'Mains' },
        take: 50,
      });

      questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(20, raw.length));
    } else if (mode === 'essay') {
      title = 'UPSC Essay Paper Simulation (Section A & Section B)';
      totalQuestions = 8;
      durationMinutes = 180;
      marksPerCorrect = 125;
      negativeMarks = 0;

      const raw = await prisma.pYQ.findMany({
        where: { examStage: 'Essay' },
        take: 20,
      });

      questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(8, raw.length));
    } else if (mode === 'sociology') {
      title = 'Sociology Optional Simulation (Paper 1 & Paper 2)';
      totalQuestions = 15;
      durationMinutes = 180;
      marksPerCorrect = 20;
      negativeMarks = 0;

      const raw = await prisma.pYQ.findMany({
        where: { examStage: 'Sociology' },
        take: 40,
      });

      questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(15, raw.length));
    }

    const formatted = questions.map((q, idx) => ({
      id: q.id,
      mockNumber: idx + 1,
      year: q.year,
      examStage: q.examStage,
      paper: q.paper,
      questionText: q.questionText,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      subjectArea: q.subjectArea,
    }));

    return NextResponse.json({
      success: true,
      mode,
      title,
      totalQuestions: formatted.length,
      durationMinutes,
      marksPerCorrect,
      negativeMarks,
      questions: formatted,
    });
  } catch (error: any) {
    console.error('Error generating test series:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
