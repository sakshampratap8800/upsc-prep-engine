import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { attemptId, pyqId, userAnswer, errorType, description } = await req.json();

    if (!errorType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let finalAttemptId = attemptId;

    // If no attemptId was provided (user didn't click "Evaluate with AI"),
    // create an AnswerAttempt record on the fly so we can link the error log.
    if (!finalAttemptId && pyqId) {
      const attempt = await prisma.answerAttempt.create({
        data: {
          pyqId,
          userAnswer: userAnswer || 'unknown',
          score: 0,
          feedback: 'Incorrect (logged from error tracker)',
          timeTakenSeconds: 0,
        },
      });
      finalAttemptId = attempt.id;
    }

    if (!finalAttemptId) {
      return NextResponse.json({ error: 'No attemptId or pyqId provided' }, { status: 400 });
    }

    const errorLog = await prisma.errorLog.create({
      data: {
        answerAttemptId: finalAttemptId,
        errorType,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, errorLog });
  } catch (error: any) {
    console.error('Failed to log error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
