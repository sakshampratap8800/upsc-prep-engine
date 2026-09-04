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
    const files = fs.readdirSync(TIMETABLE_DIR).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
    if (files.length === 0) {
      result.errors.push('No timetable DOCX found');
      result.success = false;
      return result;
    }

    const filePath = path.join(TIMETABLE_DIR, files[0]);
    const mammoth = await import('mammoth');
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    const html = htmlResult.value;

    const tasks = parseMasterTimetableHtml(html);

    // Discard old timetable data completely as requested
    await prisma.studyTask.deleteMany({});
    await prisma.importLog.deleteMany({ where: { fileType: 'timetable' } });

    for (const task of tasks) {
      let retries = 3;
      while (retries > 0) {
        try {
          await prisma.studyTask.create({
            data: {
              title: task.title,
              description: task.description || null,
              practiceRevision: task.practiceRevision || null,
              websiteAction: task.websiteAction || null,
              phase: task.phase || null,
              monthNumber: task.month || null,
              weekNumber: task.week || null,
              dayOfWeek: task.day || null,
              timeAllocation: task.time || null,
              status: 'not_started',
            },
          });
          result.tasksImported++;
          break;
        } catch {
          retries--;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    await prisma.importLog.create({
      data: {
        fileName: files[0],
        fileType: 'timetable',
        status: 'success',
        message: `Imported ${result.tasksImported} structured daily tasks across 49 weeks & interview prep`,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errMsg);
    result.success = false;
  }

  return result;
}

interface ParsedTask {
  title: string;
  description?: string;
  practiceRevision?: string;
  websiteAction?: string;
  phase?: string;
  month?: number;
  week?: number;
  day?: string;
  time?: string;
}

function parseMasterTimetableHtml(html: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const tableMatches = html.match(/<table[\s\S]*?<\/table>/g) || [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // 1. Tables 3 to 10: Weeks 1 to 8 (daily rows with Day | Task | Time)
  for (let tIdx = 2; tIdx <= 9; tIdx++) {
    if (!tableMatches[tIdx]) continue;
    const weekNum = tIdx - 1; // Week 1 to 8
    const rows = tableMatches[tIdx].match(/<tr[\s\S]*?<\/tr>/g) || [];

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].match(/<td[\s\S]*?<\/td>/g) || [];
      if (!cells[0] || !cells[1]) continue;
      const dayText = cells[0].replace(/<[^>]+>/g, '').trim();
      const taskHtml = cells[1].replace(/^<td[^>]*>/, '').replace(/<\/td>$/, '').trim();
      const timeText = cells[2] ? cells[2].replace(/<[^>]+>/g, '').trim() : '2-2.5 hrs';

      const parts = taskHtml.split(/<br\s*\/?>|<\/p>\s*<p>/i).map(s => s.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      const primary = parts[0] || dayText;
      let practice = '';
      let website = '';

      for (let p = 1; p < parts.length; p++) {
        const item = parts[p];
        const lower = item.toLowerCase();
        if (lower.startsWith('pyq') || lower.startsWith('mains:') || lower.startsWith('recall') || lower.startsWith('closed-book')) {
          practice = item;
        } else if (lower.startsWith('website:')) {
          website = item.replace(/^website:\s*/i, '');
        } else if (!practice) {
          practice = item;
        } else {
          website = item;
        }
      }

      tasks.push({
        title: primary,
        description: parts.join('\n\n'),
        practiceRevision: practice || 'Closed-book recall + 10-25 MCQs/PYQs; revise only recall gaps.',
        websiteAction: website || 'Mark study complete; inspect mapped PYQs; flag bad extraction/mapping.',
        phase: 'Foundation (NCERTs)',
        month: Math.ceil(weekNum / 4.33),
        week: weekNum,
        day: dayText,
        time: timeText,
      });
    }
  }

  // 2. Tables 14 to 24: Weeks 9 to 49 (grid format: Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun)
  for (let tIdx = 13; tIdx <= 23; tIdx++) {
    if (!tableMatches[tIdx]) continue;
    const rows = tableMatches[tIdx].match(/<tr[\s\S]*?<\/tr>/g) || [];

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].match(/<td[\s\S]*?<\/td>/g) || [];
      if (!cells[0]) continue;
      const weekHeader = cells[0].replace(/<[^>]+>/g, ' ').trim();
      const weekNumMatch = weekHeader.match(/^(\d+)/);
      const weekNum = weekNumMatch ? parseInt(weekNumMatch[1], 10) : 0;

      for (let d = 1; d <= 7; d++) {
        if (!cells[d]) continue;
        const cellHtml = cells[d].replace(/^<td[^>]*>/, '').replace(/<\/td>$/, '').trim();
        const parts = cellHtml.split(/<br\s*\/?>|<\/p>\s*<p>/i).map(s => s.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        const primary = parts[0] || `${dayNames[d - 1]} Week ${weekNum}`;
        let practice = '';
        let website = '';

        for (let p = 1; p < parts.length; p++) {
          const item = parts[p];
          const lower = item.toLowerCase();
          if (lower.startsWith('pyq') || lower.startsWith('mains:') || lower.startsWith('recall') || lower.startsWith('closed-book')) {
            practice = item;
          } else if (lower.startsWith('website:')) {
            website = item.replace(/^website:\s*/i, '');
          } else if (!practice) {
            practice = item;
          } else {
            website = item;
          }
        }

        let phase = 'Standards & Foundation';
        if (weekNum >= 13 && weekNum <= 21) phase = 'Sociology Optional';
        else if (weekNum >= 22 && weekNum <= 36) phase = 'Prelims Intensive';
        else if (weekNum >= 37 && weekNum <= 49) phase = 'Mains Intensive';

        tasks.push({
          title: primary,
          description: parts.join('\n\n'),
          practiceRevision: practice || (weekNum >= 13 ? 'Mains: 2 handwritten answers/day; use PYQs and rewrite.' : 'Mains: 1 handwritten answer/day + 10-20 PYQs; inspect demand.'),
          websiteAction: website || (d === 7 ? 'Clear due revision items; inspect topic-PYQ links; update Error Log.' : 'Mark study complete; inspect mapped PYQs; flag bad extraction/mapping.'),
          phase,
          month: Math.ceil(weekNum / 4.33),
          week: weekNum,
          day: `${dayNames[d - 1]} (W${weekNum})`,
          time: d >= 6 ? '5-6 hrs' : '3-4 hrs',
        });
      }
    }
  }

  // 3. Table 25 (Interview Preparation Phase P1 - P6)
  if (tableMatches[24]) {
    const rows = tableMatches[24].match(/<tr[\s\S]*?<\/tr>/g) || [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].match(/<td[\s\S]*?<\/td>/g) || [];
      if (!cells[0]) continue;
      const phaseName = cells[0].replace(/<[^>]+>/g, '').trim();

      for (let d = 1; d <= 7; d++) {
        if (!cells[d]) continue;
        const text = cells[d].replace(/<[^>]+>/g, ' ').trim();
        if (!text) continue;

        tasks.push({
          title: text,
          description: `Interview Preparation: ${phaseName} - ${text}`,
          practiceRevision: 'DAF questions + 1 recorded mock drill / personality review',
          websiteAction: 'Record feedback points, update key issues notebook & personality log',
          phase: 'Interview Preparation',
          month: 12,
          week: 50 + (r - 1),
          day: `${dayNames[d - 1]} (${phaseName})`,
          time: '3-4 hrs',
        });
      }
    }
  }

  return tasks;
}
