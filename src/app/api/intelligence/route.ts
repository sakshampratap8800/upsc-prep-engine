import { NextRequest, NextResponse } from 'next/server';
import { mapChaptersToTopics, mapPYQsToTopics, mapPYQsToChapters } from '@/lib/import/intelligence-pipeline';

export const maxDuration = 300; // 5 minutes max for Vercel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step } = body; // 'chapters', 'pyqs', 'link', 'all'

    const results: Record<string, unknown> = {};

    if (step === 'chapters' || step === 'all') {
      results.chapterMapping = await mapChaptersToTopics();
    }

    if (step === 'pyqs' || step === 'all') {
      results.pyqMapping = await mapPYQsToTopics();
    }

    if (step === 'link' || step === 'all') {
      results.chapterPyqLink = await mapPYQsToChapters();
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
