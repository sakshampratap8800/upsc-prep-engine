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

function isGarbageText(text: string): boolean {
  // If the text is heavily populated with random symbols, it's garbled Hindi
  const alphaMatch = text.match(/[a-zA-Z]/g);
  const alphaCount = alphaMatch ? alphaMatch.length : 0;
  const symbolMatch = text.match(/[^a-zA-Z0-9\s\.\(\)\-]/g);
  const symbolCount = symbolMatch ? symbolMatch.length : 0;
  
  if (alphaCount === 0) return true;
  // If there are more weird symbols (like ~ @) than normal letters, it's garbled
  return (symbolCount / alphaCount) > 0.5;
}

function extractPrelimsQuestions(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Pattern: number followed by question text, then (a) (b) (c) (d) options
  const qPattern = /(?:^|\n)\s*(\d+)\.\s+([\s\S]*?)(?=\n\s*\d+\.|$)/gm;
  let match;
  
  while ((match = qPattern.exec(text)) !== null && questions.length < 150) {
    const num = parseInt(match[1], 10);
    const block = match[2].trim();
    
    // Only accept if it's actual English text (filters out garbled Hindi)
    if (num > 0 && num <= 150 && block.length > 20 && !isGarbageText(block)) {
      // Check if we already have this question number (to avoid duplicates from repeating pages)
      if (questions.some(q => q.number === num)) continue;
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
  
  // Adobe Acrobat OCR puts EVERY WORD on a new line. We must flatten the text first.
  const flatText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  
  // Pattern: " 1 . [Hindi] (Answer in 150 words) 10 " OR " 1 . [Hindi] (Answer in 250 words) 15 "
  // We need to capture the question number, and then the text up to the next number
  const pattern = /\s(?:Q\.?\s*)?(\d+)\s*\.\s+([\s\S]*?)(?=\s(?:Q\.?\s*)?\d+\s*\.\s|$)/g;
  
  let match;
  while ((match = pattern.exec(flatText)) !== null && questions.length < 30) {
    const num = parseInt(match[1], 10);
    let qText = match[2].trim();
    
    // Isolate English from mixed block
    // We look for "(Answer in" which marks the END of the English question
    // The English question starts right after the Hindi marks, usually ending in " ) " or " ( "
    const englishMarksIdx = qText.indexOf('(Answer in');
    if (englishMarksIdx !== -1) {
      let hindiMarksEndIdx = qText.lastIndexOf(')', englishMarksIdx - 1);
      if (hindiMarksEndIdx === -1) hindiMarksEndIdx = qText.lastIndexOf('(', englishMarksIdx - 1);
      if (hindiMarksEndIdx === -1) hindiMarksEndIdx = 0;
      else hindiMarksEndIdx += 1;
      
      qText = qText.substring(hindiMarksEndIdx, englishMarksIdx).trim();
    }

    if (num > 0 && num <= 30 && qText.length > 15 && !isGarbageText(qText)) {
      if (questions.some(q => q.number === num)) continue;
      questions.push({
        number: num,
        text: qText,
        type: 'Descriptive',
      });
    }
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
    if (num > 0 && num <= 10 && topic.length > 10 && !isGarbageText(topic)) {
      if (questions.some(q => q.number === num)) continue;
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
