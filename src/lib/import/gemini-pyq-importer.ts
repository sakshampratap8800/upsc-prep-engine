import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../db';
import { PYQ_DIRS } from '../constants';
import fs from 'fs';
import path from 'path';

// Use the key from env, fallback to the one provided by user in chitchat script
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC0BbGX8p02h0ZMFvr0v69qLtL8I_w_WLQ';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// We'll rotate models if one hits rate limits
const MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite'
];
let currentModelIndex = 0;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function getModel() {
  return genAI.getGenerativeModel({
    model: MODELS[currentModelIndex],
    generationConfig: { responseMimeType: 'application/json' },
  });
}

function rotateModel() {
  currentModelIndex = (currentModelIndex + 1) % MODELS.length;
  console.log(`\n[!] Switching to model: ${MODELS[currentModelIndex]}`);
}

export async function importPYQsWithGemini() {
  console.log('Starting Gemini PYQ Importer...');
  const result = { success: true, totalImported: 0, questionsExtracted: 0, errors: [] as string[] };

  for (const [examStage, baseDir] of Object.entries(PYQ_DIRS)) {
    if (!fs.existsSync(baseDir)) continue;

    const yearDirs = fs.readdirSync(baseDir).filter((d) => fs.statSync(path.join(baseDir, d)).isDirectory() && /^\d{4}$/.test(d));

    for (const yearDir of yearDirs) {
      const year = parseInt(yearDir, 10);
      const yearPath = path.join(baseDir, yearDir);
      const files = fs.readdirSync(yearPath).filter(f => f.endsWith('.pdf'));

      for (const file of files) {
        const filePath = path.join(yearPath, file);
        const paper = identifyPaper(file, examStage);

        // Check if already processed
        const existing = await prisma.importLog.findFirst({
          where: { fileName: file, fileType: examStage, status: 'success' },
        });
        if (existing) {
          console.log(`Skipping (already processed): ${file}`);
          continue;
        }

        console.log(`Processing: [${year}] ${examStage} - ${file}`);
        try {
          const questions = await extractQuestionsFromPDF(filePath, examStage);
          console.log(` -> Extracted ${questions.length} questions`);

          if (questions.length > 0) {
            // Save to DB
            for (const q of questions) {
              const fullText = q.part ? `(${q.part}) ${q.text}` : q.text;
              await prisma.pYQ.create({
                data: {
                  year,
                  examStage: examStage.charAt(0).toUpperCase() + examStage.slice(1),
                  paper,
                  questionNumber: q.main_number,
                  questionText: fullText,
                  questionType: examStage === 'prelims' ? 'MCQ' : 'Descriptive',
                  sourceFile: file,
                  confidence: 0.95,
                  optionsJson: q.options ? JSON.stringify(q.options) : null
                }
              });
            }
            result.questionsExtracted += questions.length;
            result.totalImported++;

            await prisma.importLog.create({
              data: { fileName: file, fileType: examStage, status: 'success', message: `Extracted ${questions.length} using Gemini` }
            });
          }
          
          // Wait to respect rate limits
          await delay(4500);

        } catch (err: any) {
          console.error(` -> Error processing ${file}:`, err.message);
          result.errors.push(`${file}: ${err.message}`);
          
          if (err.message?.includes('429')) {
            console.log(' -> Rate limit hit. Rotating model and pausing for 30s...');
            rotateModel();
            await delay(30000);
          }
        }
      }
    }
  }
  
  console.log('Import Complete!', result);
  return result;
}

async function extractQuestionsFromPDF(filePath: string, examStage: string) {
  const fileBytes = fs.readFileSync(filePath);
  const base64Data = fileBytes.toString('base64');
  
  const prompt = `You are a strict data extraction AI processing a UPSC CSE Question Paper PDF.
Your task is to extract every question in perfectly clean English.

CRITICAL RULES:
1. DISCARD ALL HINDI / DEVANAGARI TEXT ENTIRELY. 
2. Maintain hierarchical sub-questions. If question 1 has parts (a), (b), (c), return them as separate objects but with the same main_number (1) and their respective part ("a", "b", "c").
3. DO NOT merge different parts of a question into a single text block.
4. Output a clean JSON array of objects with this exact schema:
[
  {
    "main_number": 1,
    "part": "a", // omit if not a subpart
    "text": "The actual English question text...",
    "options": ["(a) Option 1", "(b) Option 2"] // only for MCQs, omit otherwise
  }
]
5. Only extract the question text, ignore administrative instructions (e.g. "Write on the following in about 150 words", "Maximum Marks").
6. NEVER USE MARKDOWN \`\`\`json BLOCKS. Output raw JSON ONLY.`;

  let retries = 2;
  while (retries > 0) {
    try {
      const model = getModel();
      const result = await model.generateContent([
        { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
        prompt
      ]);
      const response = result.response.text();
      // Safely parse
      const cleanedJson = response.replace(/^```json/m, '').replace(/```$/m, '').trim();
      return JSON.parse(cleanedJson);
    } catch (e: any) {
      if (e.message?.includes('429')) throw e; // Let main loop handle rotation
      retries--;
      if (retries === 0) throw e;
      await delay(2000);
    }
  }
  return [];
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
    return 'GS-I'; 
  }
  if (examStage === 'essay') return 'Essay';
  if (examStage === 'anthropology' || examStage === 'sociology') {
    const subject = examStage.charAt(0).toUpperCase() + examStage.slice(1);
    if (fn.includes('paper-ii') || fn.includes('paper_ii') || fn.includes('paper ii') || fn.includes('2.pdf') || fn.includes('_ii.') || fn.includes('-ii.') || fn.includes('-ii-')) return `${subject} Paper-II`;
    return `${subject} Paper-I`;
  }
  return 'Unknown';
}
