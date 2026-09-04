'use server';

import prisma from '@/lib/db';

export async function submitAnswer(
  pyqId: number,
  userAnswer: string,
  timeTakenSeconds: number
) {
  try {
    const pyq = await prisma.pYQ.findUnique({ where: { id: pyqId } });

    let score: number | null = null;
    let feedback: string | null = null;

    if (pyq?.correctAnswer) {
      const normalise = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const isCorrect = normalise(userAnswer) === normalise(pyq.correctAnswer);
      score = isCorrect ? 1 : 0;
      feedback = isCorrect
        ? 'Correct!'
        : `Incorrect. The correct answer is: ${pyq.correctAnswer}`;
    }

    const attempt = await prisma.answerAttempt.create({
      data: {
        pyqId,
        userAnswer,
        score,
        feedback,
        timeTakenSeconds,
      },
    });

    return {
      success: true,
      attemptId: attempt.id,
      score,
      feedback,
      correctAnswer: pyq?.correctAnswer ?? null,
      explanation: pyq?.explanation ?? null,
    };
  } catch (error) {
    console.error('Failed to submit answer:', error);
    return { success: false, error: 'Failed to submit answer' };
  }
}

export async function logError(
  attemptId: number,
  errorType: string,
  description: string
) {
  try {
    await prisma.errorLog.create({
      data: {
        answerAttemptId: attemptId,
        errorType,
        description,
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to log error:', error);
    return { success: false, error: 'Failed to log error' };
  }
}
