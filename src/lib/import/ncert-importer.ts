import { parsePDF } from './pdf-parser';
import prisma from '@/lib/db';
import { NCERT_BOOKS, SUBJECT_DIRS } from '@/lib/constants';
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

  for (const bookMeta of NCERT_BOOKS) {
    try {
      const subjectDir = SUBJECT_DIRS[bookMeta.subject.toLowerCase() as keyof typeof SUBJECT_DIRS];
      const filePath = path.join(subjectDir, bookMeta.fileName);

      if (!fs.existsSync(filePath)) {
        result.errors.push(`File not found: ${filePath}`);
        continue;
      }

      // Create or find subject
      const subject = await prisma.subject.upsert({
        where: { slug: bookMeta.subject.toLowerCase() },
        update: {},
        create: {
          name: bookMeta.subject,
          slug: bookMeta.subject.toLowerCase(),
          description: `NCERT ${bookMeta.subject} textbooks`,
        },
      });

      // Check if book already imported
      const existingBook = await prisma.book.findFirst({
        where: { fileName: bookMeta.fileName },
      });
      if (existingBook) {
        result.errors.push(`Already imported: ${bookMeta.fileName}`);
        continue;
      }

      // Parse PDF
      const parsed = await parsePDF(filePath);

      // Extract chapters
      const chapters = extractChapters(parsed.text, parsed.pages);

      // Create book
      const book = await prisma.book.create({
        data: {
          title: bookMeta.title,
          className: bookMeta.className,
          subjectId: subject.id,
          fileName: bookMeta.fileName,
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

      // Log import
      await prisma.importLog.create({
        data: {
          fileName: bookMeta.fileName,
          fileType: 'ncert',
          status: 'success',
          message: `Imported ${chapters.length} chapters`,
        },
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Error importing ${bookMeta.fileName}: ${errMsg}`);
      result.success = false;

      await prisma.importLog.create({
        data: {
          fileName: bookMeta.fileName,
          fileType: 'ncert',
          status: 'error',
          message: errMsg,
        },
      });
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
        matches.push({
          number: num,
          title: match[2].trim().replace(/\s+/g, ' '),
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
