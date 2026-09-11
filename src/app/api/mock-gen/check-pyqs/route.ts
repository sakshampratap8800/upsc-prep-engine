import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chapterId = parseInt(searchParams.get('chapterId') || '0', 10);

    if (!chapterId) {
      return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });
    }

    const pyqs = await prisma.pYQ.findMany({
      where: {
        isAiGenerated: true,
        chapters: {
          some: { id: chapterId }
        }
      },
      select: {
        id: true,
        year: true,
        examStage: true,
        paper: true,
        questionNumber: true,
        questionText: true,
        subjectArea: true,
        difficulty: true,
        isAiGenerated: true,
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ success: true, pyqs });
  } catch (error: any) {
    console.error('Failed to check PYQs:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
