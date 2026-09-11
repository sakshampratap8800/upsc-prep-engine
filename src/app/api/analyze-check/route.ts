import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chapterId = parseInt(searchParams.get('chapterId') || '0', 10);
    if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { summary: true, keyConceptsJson: true, definitionsJson: true }
    });
    
    if (!chapter || !chapter.summary) return NextResponse.json({ status: 'pending' });
    
    return NextResponse.json({ 
      status: 'completed', 
      summary: chapter.summary,
      keyConceptsJson: chapter.keyConceptsJson,
      definitionsJson: chapter.definitionsJson
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
