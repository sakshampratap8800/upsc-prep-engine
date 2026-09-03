import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json({ chapters: [], pyqs: [], topics: [] });

  try {
    const searchTerm = `%${q}%`;

    const [chapters, pyqs, topics] = await Promise.all([
      prisma.chapter.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
        select: {
          id: true,
          number: true,
          title: true,
          book: { select: { id: true, title: true, subject: { select: { slug: true } } } },
        },
        take: 20,
      }),
      prisma.pYQ.findMany({
        where: {
          OR: [
            { questionText: { contains: q } },
            { subjectArea: { contains: q } },
          ],
        },
        select: {
          id: true,
          year: true,
          examStage: true,
          paper: true,
          questionText: true,
        },
        take: 20,
        orderBy: { year: 'desc' },
      }),
      prisma.syllabusTopic.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, paper: true },
        take: 20,
      }),
    ]);

    return NextResponse.json({ chapters, pyqs, topics });
  } catch {
    return NextResponse.json({ chapters: [], pyqs: [], topics: [] });
  }
}
