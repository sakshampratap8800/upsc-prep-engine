import prisma from '@/lib/db';
import { TIMETABLE_DIR } from '@/lib/constants';
import path from 'path';
import fs from 'fs';

export interface TimetableImportResult {
  success: boolean;
  tasksImported: number;
  errors: string[];
}

export async function importTimetable(): Promise<TimetableImportResult> {
  const result: TimetableImportResult = { success: true, tasksImported: 0, errors: [] };

  try {
    const files = fs.readdirSync(TIMETABLE_DIR).filter(f => f.endsWith('.docx'));
    if (files.length === 0) {
      result.errors.push('No timetable DOCX found');
      result.success = false;
      return result;
    }

    const filePath = path.join(TIMETABLE_DIR, files[0]);
    const mammoth = await import('mammoth');
    const docResult = await mammoth.extractRawText({ path: filePath });
    const text = docResult.value;

    // Parse the timetable structure
    const tasks = parseTimetable(text);

    for (const task of tasks) {
      await prisma.studyTask.create({
        data: {
          title: task.title,
          description: task.description || null,
          monthNumber: task.month || null,
          weekNumber: task.week || null,
          dayOfWeek: task.day || null,
          timeAllocation: task.time || null,
          status: 'not_started',
        },
      });
      result.tasksImported++;
    }

    await prisma.importLog.create({
      data: { fileName: files[0], fileType: 'timetable', status: 'success', message: `Imported ${result.tasksImported} tasks` },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errMsg);
    result.success = false;
  }

  return result;
}

interface TimetableTask {
  title: string;
  description?: string;
  month?: number;
  week?: number;
  day?: string;
  time?: string;
}

function parseTimetable(text: string): TimetableTask[] {
  const tasks: TimetableTask[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentMonth = 0;
  let currentWeek = 0;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect month headers: "Month 1-2", "Month 3"
    const monthMatch = line.match(/Month\s+(\d+)(?:[–-](\d+))?/i);
    if (monthMatch) {
      currentMonth = parseInt(monthMatch[1], 10);
      continue;
    }

    // Detect week headers: "Week 1", "Week 1 (Days 1-7)"
    const weekMatch = line.match(/Week\s+(\d+)/i);
    if (weekMatch) {
      currentWeek = parseInt(weekMatch[1], 10);
      continue;
    }

    // Detect day-task entries
    const dayMatch = days.find(d => line.startsWith(d));
    if (dayMatch) {
      // Next line(s) are typically the task
      const taskLine = line.replace(dayMatch, '').trim();
      if (taskLine.length > 5) {
        // Look for time allocation
        const timeMatch = taskLine.match(/(\d+(?:\.\d+)?\s*hrs?)/i);
        tasks.push({
          title: taskLine.replace(timeMatch?.[0] || '', '').trim().slice(0, 200),
          description: taskLine,
          month: currentMonth || undefined,
          week: currentWeek || undefined,
          day: dayMatch,
          time: timeMatch?.[1] || undefined,
        });
      }
      continue;
    }

    // Detect standalone tasks with NCERT references
    if (line.includes('NCERT') || line.includes('revision') || line.includes('mock') || line.includes('PYQ')) {
      if (line.length > 10 && line.length < 300) {
        const timeMatch = line.match(/(\d+(?:\.\d+)?\s*hrs?)/i);
        tasks.push({
          title: line.replace(timeMatch?.[0] || '', '').trim().slice(0, 200),
          description: line,
          month: currentMonth || undefined,
          week: currentWeek || undefined,
          time: timeMatch?.[1] || undefined,
        });
      }
    }
  }

  return tasks;
}
