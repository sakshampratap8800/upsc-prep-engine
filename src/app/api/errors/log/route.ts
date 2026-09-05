import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { attemptId, errorType, description } = await req.json();

    if (!attemptId || !errorType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const errorLog = await prisma.errorLog.create({
      data: {
        answerAttemptId: attemptId,
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
