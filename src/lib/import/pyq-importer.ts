import { parsePDF } from './pdf-parser';
import prisma from '@/lib/db';
import { PYQ_DIRS } from '@/lib/constants';
import path from 'path';
import fs from 'fs';

export interface PYQImportResult {
  success: boolean;
  totalImported: number;
  questionsExtracted: number;
  errors: string[];
}

export async function importAllPYQs(): Promise<PYQImportResult> {
  const result: PYQImportResult = { success: true, totalImported: 0, questionsExtracted: 0, errors: [] };

  for (const [examStage, baseDir] of Object.entries(PYQ_DIRS)) {
    if (!fs.existsSync(baseDir)) {
      result.errors.push(`Directory not found: ${baseDir}`);
      continue;
    }

    const yearDirs = fs.readdirSync(baseDir).filter((d) => {
      const fullPath = path.join(baseDir, d);
      return fs.statSync(fullPath).isDirectory() && /^\d{4}$/.test(d);
    });

    for (const yearDir of yearDirs) {
      const year = parseInt(yearDir, 10);
      const yearPath = path.join(baseDir, yearDir);
      const files = fs.readdirSync(yearPath).filter((f) => f.toLowerCase().endsWith('.pdf'));

      for (const file of files) {
        try {
          const filePath = path.join(yearPath, file);

          // Check if already imported
          const existing = await prisma.importLog.findFirst({
            where: { fileName: file, fileType: examStage, status: 'success' },
          });
          if (existing) continue;

          const parsed = await parsePDF(filePath);
          const paper = identifyPaper(file, examStage);
          const questions = extractQuestions(parsed.text, examStage, parsed.pages);

          for (const q of questions) {
            await prisma.pYQ.create({
              data: {
                year,
                examStage: examStage.charAt(0).toUpperCase() + examStage.slice(1),
                paper,
                questionNumber: q.number,
                questionText: q.text,
                optionsJson: q.options ? JSON.stringify(q.options) : null,
                correctAnswer: q.answer || null,
                difficulty: null,
                questionType: q.type || null,
                subjectArea: null,
                sourceFile: file,
                sourcePage: q.page || null,
                confidence: 0.8,
              },
            });
            result.questionsExtracted++;
          }

          result.totalImported++;
          await prisma.importLog.create({
            data: { fileName: file, fileType: examStage, status: 'success', message: `Extracted ${questions.length} questions` },
          });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Error: ${file}: ${errMsg}`);
          await prisma.importLog.create({
            data: { fileName: file, fileType: examStage, status: 'error', message: errMsg },
          });
        }
      }
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

function identifyPaper(fileName: string, examStage: string): string {
  const fn = fileName.toLowerCase();

  if (examStage === 'prelims') {
    if (fn.includes('paper1') || fn.includes('paper-1') || fn.includes('paper_1')) return 'Paper 1 (GS)';
    if (fn.includes('paper2') || fn.includes('paper-2') || fn.includes('paper_2')) return 'Paper 2 (CSAT)';
    return 'Paper 1 (GS)';
  }

  if (examStage === 'mains') {
    if (fn.includes('_i_') || fn.includes('-i-') || fn.includes('_i.') || fn.includes('paper-i') || fn.includes('paper i') || fn.includes('gs1') || fn.includes('genstud_i') || fn.includes('gen_st_p1') || fn.includes('paper - i')) return 'GS-I';
    if (fn.includes('_ii_') || fn.includes('-ii-') || fn.includes('_ii.') || fn.includes('paper-ii') || fn.includes('paper ii') || fn.includes('gs2') || fn.includes('genstud_ii') || fn.includes('gen_st_p2') || fn.includes('paper - ii')) return 'GS-II';
    if (fn.includes('_iii') || fn.includes('-iii') || fn.includes('gs3') || fn.includes('genstud_iii') || fn.includes('gen_st_p3') || fn.includes('paper - iii')) return 'GS-III';
    if (fn.includes('_iv') || fn.includes('-iv') || fn.includes('gs4') || fn.includes('genstud_iv') || fn.includes('gen_st_p4') || fn.includes('paper - iv')) return 'GS-IV';
    return 'GS-I'; // fallback
  }

  if (examStage === 'essay') return 'Essay';

  if (examStage === 'anthropology' || examStage === 'sociology') {
    const subject = examStage.charAt(0).toUpperCase() + examStage.slice(1);
    if (fn.includes('paper-ii') || fn.includes('paper_ii') || fn.includes('paper ii') || fn.includes('2.pdf') || fn.includes('_ii.') || fn.includes('-ii.') || fn.includes('-ii-')) return `${subject} Paper-II`;
    return `${subject} Paper-I`;
  }

  return 'Unknown';
}

interface ExtractedQuestion {
  number: number;
  text: string;
  options?: string[];
  answer?: string;
  type?: string;
  page?: number;
}

function extractQuestions(fullText: string, examStage: string, pages: string[]): ExtractedQuestion[] {
  if (examStage === 'prelims') {
    return extractPrelimsQuestions(fullText);
  } else if (examStage === 'mains') {
    return extractMainsQuestions(fullText);
  } else if (examStage === 'essay') {
    return extractEssayTopics(fullText);
  } else {
    // Anthropology / Sociology - treat like mains
    return extractMainsQuestions(fullText);
  }
}

function extractPrelimsQuestions(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Pattern: number followed by question text, then (a) (b) (c) (d) options
  const qPattern = /(?:^|\n)\s*(\d+)\.\s+([\s\S]*?)(?=\n\s*\d+\.|$)/gm;
  let match;
  
  while ((match = qPattern.exec(text)) !== null && questions.length < 150) {
    const num = parseInt(match[1], 10);
    const block = match[2].trim();
    
    if (num > 0 && num <= 150 && block.length > 20) {
      // Try to extract options
      const options: string[] = [];
      const optPattern = /\(([a-d])\)\s+([^\(\n]+)/gi;
      let optMatch;
      while ((optMatch = optPattern.exec(block)) !== null) {
        options.push(`(${optMatch[1]}) ${optMatch[2].trim()}`);
      }
      
      // Clean question text (remove options from it)
      let qText = block;
      if (options.length > 0) {
        const firstOptIdx = block.search(/\([a-d]\)/i);
        if (firstOptIdx > 0) {
          qText = block.slice(0, firstOptIdx).trim();
        }
      }
      
      questions.push({
        number: num,
        text: qText,
        options: options.length > 0 ? options : undefined,
        type: 'MCQ',
      });
    }
  }
  
  return questions;
}

function extractMainsQuestions(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Mains pattern: Q.1, 1., Q1., etc. followed by question text
  const patterns = [
    /(?:^|\n)\s*(?:Q\.?\s*)?(\d+)\.?\s*(?:\(a\)|[\)])?\s+([\s\S]*?)(?=\n\s*(?:Q\.?\s*)?\d+\.?\s|$)/gm,
    /(?:^|\n)\s*(\d+)\)\s+([\s\S]*?)(?=\n\s*\d+\)|$)/gm,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null && questions.length < 30) {
      const num = parseInt(match[1], 10);
      const qText = match[2].trim().replace(/\s+/g, ' ');
      
      if (num > 0 && num <= 30 && qText.length > 15) {
        questions.push({
          number: num,
          text: qText,
          type: 'Descriptive',
        });
      }
    }
    if (questions.length > 0) break;
  }
  
  // Fallback: if no questions found, store entire text as a single entry
  if (questions.length === 0 && text.trim().length > 50) {
    questions.push({
      number: 1,
      text: text.trim().slice(0, 5000),
      type: 'Descriptive',
    });
  }
  
  return questions;
}

function extractEssayTopics(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Essays are typically 4-8 topics
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);
  
  // Look for numbered topics or distinct paragraphs
  const pattern = /(?:^|\n)\s*(\d+)\.?\s+([^\n]+)/gm;
  let match;
  while ((match = pattern.exec(text)) !== null && questions.length < 10) {
    const num = parseInt(match[1], 10);
    const topic = match[2].trim();
    if (num > 0 && num <= 10 && topic.length > 10) {
      questions.push({
        number: num,
        text: topic,
        type: 'Essay',
      });
    }
  }
  
  if (questions.length === 0) {
    // Fallback: treat substantial lines as essay topics
    let counter = 1;
    for (const line of lines) {
      if (line.length > 30 && line.length < 300 && !line.includes('UPSC') && !line.includes('examination') && counter <= 8) {
        questions.push({ number: counter++, text: line, type: 'Essay' });
      }
    }
  }
  
  return questions;
}
