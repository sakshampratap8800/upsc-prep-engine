import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) {
    return NextResponse.json({ chapters: [], pyqs: [], topics: [], tasks: [] });
  }

  try {
    const trimmed = q.trim();

    const [chapters, pyqs, topics, tasks] = await Promise.all([
      // 1. Chapters & Notes Search
      prisma.chapter.findMany({
        where: {
          OR: [
            { title: { contains: trimmed } },
            { summary: { contains: trimmed } },
            { definitionsJson: { contains: trimmed } },
            { keyConceptsJson: { contains: trimmed } },
            { content: { contains: trimmed } },
          ],
        },
        select: {
          id: true,
          number: true,
          title: true,
          summary: true,
          definitionsJson: true,
          book: {
            select: {
              id: true,
              title: true,
              className: true,
              subject: { select: { name: true, slug: true } },
            },
          },
        },
        take: 15,
      }),

      // 2. PYQ Search (3,032 Questions)
      prisma.pYQ.findMany({
        where: {
          OR: [
            { questionText: { contains: trimmed } },
            { subjectArea: { contains: trimmed } },
            { explanation: { contains: trimmed } },
            { paper: { contains: trimmed } },
          ],
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
        },
        take: 20,
        orderBy: { year: 'desc' },
      }),

      // 3. Syllabus Topics Search
      prisma.syllabusTopic.findMany({
        where: {
          OR: [
            { name: { contains: trimmed } },
            { description: { contains: trimmed } },
          ],
        },
        select: { id: true, name: true, paper: true, description: true },
        take: 15,
      }),

      // 4. Study Tasks / Timetable Search (399 tasks)
      prisma.studyTask.findMany({
        where: {
          OR: [
            { title: { contains: trimmed } },
            { practiceRevision: { contains: trimmed } },
            { websiteAction: { contains: trimmed } },
            { phase: { contains: trimmed } },
          ],
        },
        select: {
          id: true,
          title: true,
          phase: true,
          timeAllocation: true,
          monthNumber: true,
          weekNumber: true,
          dayOfWeek: true,
          status: true,
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({ chapters, pyqs, topics, tasks });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ chapters: [], pyqs: [], topics: [], tasks: [] });
  }
}
