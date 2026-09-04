import { parsePDF } from './pdf-parser';
import prisma from '@/lib/db';
import { NCERT_BOOKS, SUBJECT_DIRS, BOOKS_BASE_PATH } from '@/lib/constants';
import path from 'path';
import fs from 'fs';

export interface ImportResult {
  success: boolean;
  booksImported: number;
  chaptersExtracted: number;
  errors: string[];
}

export async function importNCERTs(): Promise<ImportResult> {
  const result: ImportResult = { success: true, booksImported: 0, chaptersExtracted: 0, errors: [] };

  const ignoredDirs = ['PYQ', 'syllabus', 'timetable', 'upsc-app'];
  const baseDirs = fs.readdirSync(BOOKS_BASE_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory() && !ignoredDirs.includes(d.name));

  for (const dir of baseDirs) {
    const subjectName = dir.name.charAt(0).toUpperCase() + dir.name.slice(1);
    const subjectDirPath = path.join(BOOKS_BASE_PATH, dir.name);
    
    let pdfFiles = [];
    try {
      pdfFiles = fs.readdirSync(subjectDirPath).filter(f => f.toLowerCase().endsWith('.pdf'));
    } catch (e) {
      continue;
    }

    for (const fileName of pdfFiles) {
      try {
        const filePath = path.join(subjectDirPath, fileName);

        // Deduplication using fileName as stable identifier
        const existingBook = await prisma.book.findFirst({
          where: { fileName: fileName },
        });
        if (existingBook) {
          continue;
        }

        // Create or find subject
        const subject = await prisma.subject.upsert({
          where: { slug: subjectName.toLowerCase() },
          update: {},
          create: {
            name: subjectName,
            slug: subjectName.toLowerCase(),
            description: `NCERT ${subjectName} textbooks`,
          },
        });

        // Parse Class Name from filename (e.g. "Class-12-Macroeconomics.pdf")
        let className = 0;
        const classMatch = fileName.match(/Class[_\-\s]?(\d+)|([IXV]+)/i);
        if (classMatch) {
          className = classMatch[1] ? parseInt(classMatch[1], 10) : 0;
        }

        // Parse title from filename
        let title = fileName.replace('.pdf', '').replace(/[-_]/g, ' ');

        // Parse PDF
        const parsed = await parsePDF(filePath);

        // Extract chapters
        const chapters = extractChapters(parsed.text, parsed.pages);

        // Create book
        const book = await prisma.book.create({
          data: {
            title: title,
            className: className,
            subjectId: subject.id,
            fileName: fileName,
            filePath: filePath,
            totalChapters: chapters.length,
          },
        });

        // Create chapters
        for (const ch of chapters) {
          await prisma.chapter.create({
            data: {
              number: ch.number,
              title: ch.title,
              bookId: book.id,
              content: ch.content,
              summary: ch.content.slice(0, 500),
              keyConceptsJson: JSON.stringify(extractKeyConcepts(ch.content)),
              definitionsJson: JSON.stringify(extractDefinitions(ch.content)),
              findOutQuestionsJson: JSON.stringify(extractFindOutQuestions(ch.content)),
            },
          });
          result.chaptersExtracted++;
        }

        result.booksImported++;

        await prisma.importLog.create({
          data: {
            fileName: fileName,
            fileType: 'ncert',
            status: 'success',
            message: `Imported ${chapters.length} chapters`,
          },
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error importing ${fileName}: ${errMsg}`);
        result.success = false;

        await prisma.importLog.create({
          data: {
            fileName: fileName,
            fileType: 'ncert',
            status: 'error',
            message: errMsg,
          },
        });
      }
    }
  }

  return result;
}

interface ExtractedChapter {
  number: number;
  title: string;
  content: string;
}

function extractChapters(fullText: string, pages: string[]): ExtractedChapter[] {
  const chapters: ExtractedChapter[] = [];

  // Try multiple chapter detection patterns
  const patterns = [
    /(?:^|\n)\s*(?:CHAPTER|Chapter|chapter)\s+(\d+)[\s\n]+([^\n]+)/gm,
    /(?:^|\n)\s*(\d+)\.\s+([A-Z][A-Z\s]+[A-Z])\s*\n/gm,
    /(?:^|\n)\s*(?:CHAPTER|Chapter)\s+([IVXLCDM]+)[\s\n]+([^\n]+)/gm,
  ];

  interface ChapterMatch {
    number: number;
    title: string;
    index: number;
  }

  let matches: ChapterMatch[] = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(fullText)) !== null) {
      let num: number;
      const raw = match[1].trim();
      if (/^[IVXLCDM]+$/.test(raw)) {
        num = romanToInt(raw);
      } else {
        num = parseInt(raw, 10);
      }
      if (!isNaN(num) && num > 0 && num <= 50) {
        let rawTitle = match[2].trim().replace(/\s+/g, ' ');
        
        // 1. Fix duplicated string issue (e.g. "WHAT IS DEMOCRACYWHAT IS DEMOCRACY")
        const half = Math.floor(rawTitle.length / 2);
        if (rawTitle.length > 10 && rawTitle.slice(0, half).trim() === rawTitle.slice(half).trim()) {
          rawTitle = rawTitle.slice(0, half).trim();
        }
        
        // 2. Validate title quality
        if (rawTitle.length < 3 || rawTitle.length > 150) continue;
        const alphaMatch = rawTitle.match(/[a-zA-Z]/g);
        if (!alphaMatch || alphaMatch.length < rawTitle.length * 0.4) continue;
        
        // 3. Remove weird header trailing artifacts like page numbers
        rawTitle = rawTitle.replace(/[\d\.\-\_]+$/, '').trim();

        matches.push({
          number: num,
          title: rawTitle,
          index: match.index,
        });
      }
    }
    if (matches.length >= 3) break; // Good enough
  }

  // Deduplicate by chapter number
  const seen = new Set<number>();
  matches = matches.filter((m) => {
    if (seen.has(m.number)) return false;
    seen.add(m.number);
    return true;
  });

  // Sort by position in text
  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    // Fallback: treat entire PDF as one chapter
    chapters.push({
      number: 1,
      title: 'Full Content',
      content: fullText.slice(0, 50000), // Limit size
    });
    return chapters;
  }

  // Extract content between chapter markers
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : fullText.length;
    const content = fullText.slice(start, end).trim();

    chapters.push({
      number: matches[i].number,
      title: matches[i].title,
      content: content.slice(0, 50000), // Limit to avoid huge DB entries
    });
  }

  return chapters;
}

function romanToInt(roman: string): number {
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = values[roman[i]] || 0;
    const next = values[roman[i + 1]] || 0;
    result += current < next ? -current : current;
  }
  return result;
}

function extractKeyConcepts(text: string): string[] {
  const concepts: string[] = [];
  // Look for bold-like patterns or key terms
  const patterns = [
    /(?:Key Concept|Important|Note)[:\s]+([^.\n]+)/gi,
    /(?:defined as|means|refers to)[:\s]+([^.]+)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null && concepts.length < 20) {
      concepts.push(match[1].trim());
    }
  }
  return concepts;
}

function extractDefinitions(text: string): Array<{ term: string; definition: string }> {
  const definitions: Array<{ term: string; definition: string }> = [];
  const patterns = [
    /([A-Z][a-zA-Z\s]+)\s+(?:is defined as|means|refers to|is)\s+([^.]+\.)/g,
    /(?:Definition|Define)[:\s]+([^.]+\.)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null && definitions.length < 20) {
      if (match.length >= 3) {
        definitions.push({ term: match[1].trim(), definition: match[2].trim() });
      } else {
        definitions.push({ term: 'Definition', definition: match[1].trim() });
      }
    }
  }
  return definitions;
}

function extractFindOutQuestions(text: string): string[] {
  const questions: string[] = [];
  const pattern = /(?:Find [Oo]ut|FIND OUT|Activity)[:\s]+([^\n]+(?:\n[^\n]+)?)/g;
  let match;
  while ((match = pattern.exec(text)) !== null && questions.length < 10) {
    questions.push(match[1].trim());
  }
  return questions;
}
