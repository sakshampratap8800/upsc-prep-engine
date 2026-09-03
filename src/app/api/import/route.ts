import { NextRequest, NextResponse } from 'next/server';
import { importNCERTs } from '@/lib/import/ncert-importer';
import { importAllPYQs } from '@/lib/import/pyq-importer';
import { importSyllabus } from '@/lib/import/syllabus-importer';
import { importTimetable } from '@/lib/import/timetable-importer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body; // 'ncert', 'pyq', 'syllabus', 'timetable', 'all'

    const results: Record<string, unknown> = {};

    if (type === 'ncert' || type === 'all') {
      results.ncert = await importNCERTs();
    }

    if (type === 'pyq' || type === 'all') {
      results.pyq = await importAllPYQs();
    }

    if (type === 'syllabus' || type === 'all') {
      results.syllabus = await importSyllabus();
    }

    if (type === 'timetable' || type === 'all') {
      results.timetable = await importTimetable();
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
