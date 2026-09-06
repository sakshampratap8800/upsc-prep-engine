import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'prelims_gs1'; // prelims_gs1 | prelims_csat | mains_gs | essay | sociology
    const yearParam = searchParams.get('year');
    const targetYear = yearParam && yearParam !== 'all' ? parseInt(yearParam, 10) : null;

    let questions: any[] = [];
    let title = '';
    let totalQuestions = 100;
    let durationMinutes = 120;
    let marksPerCorrect = 2.0;
    let negativeMarks = 0.66;

    if (mode === 'prelims_gs1') {
      totalQuestions = 100;
      durationMinutes = 120;
      marksPerCorrect = 2.0;
      negativeMarks = 0.66;

      if (targetYear) {
        title = `UPSC Prelims GS Paper 1 (${targetYear} Official Exam Paper)`;
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Prelims', paper: { contains: 'Paper 1' }, year: targetYear },
          orderBy: [{ questionNumber: 'asc' }, { id: 'asc' }],
          take: 100,
        });
        questions = raw;
      } else {
        title = 'UPSC Prelims GS Paper 1 (Full 100Q Randomized Mock)';
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Prelims', paper: { contains: 'Paper 1' } },
        });
        questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(100, raw.length));
      }
    } else if (mode === 'prelims_csat') {
      totalQuestions = 80;
      durationMinutes = 120;
      marksPerCorrect = 2.5;
      negativeMarks = 0.83;

      if (targetYear) {
        title = `UPSC Prelims CSAT Paper 2 (${targetYear} Official Exam Paper)`;
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Prelims', paper: { contains: 'Paper 2' }, year: targetYear },
          orderBy: [{ questionNumber: 'asc' }, { id: 'asc' }],
          take: 80,
        });
        questions = raw;
      } else {
        title = 'UPSC Prelims CSAT Paper 2 (80Q Randomized Mock Simulator)';
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Prelims', paper: { contains: 'Paper 2' } },
        });
        questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(80, raw.length));
      }
    } else if (mode === 'mains_gs') {
      totalQuestions = 20;
      durationMinutes = 180;
      marksPerCorrect = 12.5;
      negativeMarks = 0;

      if (targetYear) {
        title = `UPSC Mains GS Paper (${targetYear} Official Exam Paper)`;
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Mains', year: targetYear },
          orderBy: [{ paper: 'asc' }, { questionNumber: 'asc' }, { id: 'asc' }],
          take: 20,
        });
        questions = raw;
      } else {
        title = 'UPSC Mains GS Full Simulation Paper (20 Questions)';
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Mains' },
        });
        questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(20, raw.length));
      }
    } else if (mode === 'essay') {
      totalQuestions = 8;
      durationMinutes = 180;
      marksPerCorrect = 125;
      negativeMarks = 0;

      if (targetYear) {
        title = `UPSC Essay Paper (${targetYear} Official Topics)`;
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Essay', year: targetYear },
          orderBy: [{ questionNumber: 'asc' }, { id: 'asc' }],
          take: 8,
        });
        questions = raw;
      } else {
        title = 'UPSC Essay Paper Simulation (Section A & Section B)';
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Essay' },
        });
        questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(8, raw.length));
      }
    } else if (mode === 'sociology') {
      totalQuestions = 15;
      durationMinutes = 180;
      marksPerCorrect = 20;
      negativeMarks = 0;

      if (targetYear) {
        title = `Sociology Optional (${targetYear} Official Paper)`;
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Sociology', year: targetYear },
          orderBy: [{ paper: 'asc' }, { questionNumber: 'asc' }, { id: 'asc' }],
          take: 15,
        });
        questions = raw;
      } else {
        title = 'Sociology Optional Simulation (Paper 1 & Paper 2)';
        const raw = await prisma.pYQ.findMany({
          where: { examStage: 'Sociology' },
        });
        questions = raw.sort(() => Math.random() - 0.5).slice(0, Math.min(15, raw.length));
      }
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
