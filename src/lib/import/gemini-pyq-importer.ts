import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import prisma from '../db';
import { PYQ_DIRS } from '../constants';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

const MODELS = [
  'gemini-3.1-flash-lite',
];
let currentModelIndex = 0;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function getModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: { 
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });
}

function rotateModel() {
  // Exclusively using gemini-3.1-flash-lite as configured
  console.log(`\n[!] Retrying with model: gemini-3.1-flash-lite`);
}

export async function importPYQsWithGemini() {
  console.log('Starting Gemini PYQ Importer (File API Enabled)...');
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

        // Check if already processed with retry
        let existing = null;
        let checkRetries = 3;
        while (checkRetries > 0) {
          try {
            existing = await prisma.importLog.findFirst({
              where: { fileName: file, fileType: examStage, status: 'success' },
            });
            break;
          } catch (err: any) {
            checkRetries--;
            if (checkRetries === 0) {
              console.warn(`Could not check importLog for ${file}, assuming not imported:`, err.message?.slice(0, 80));
            } else {
              await delay(2000);
            }
          }
        }
        if (existing) {
          console.log(`Skipping (already processed): ${file}`);
          continue;
        }

        console.log(`Processing: [${year}] ${examStage} - ${file}`);
        try {
          const questions = await extractQuestionsFromPDF(filePath, examStage);
          console.log(` -> Extracted ${questions.length} questions`);

          if (questions.length > 0) {
            // Group sub-parts (a, b, c) by main_number into unified formatted questions
            const groupedByNumber = new Map<number, { textParts: string[]; options: string[] | null; type: string }>();
            for (const q of questions) {
              const num = q.main_number || 1;
              const formattedPart = q.part ? `(${q.part}) ${q.text}` : q.text;
              if (!groupedByNumber.has(num)) {
                groupedByNumber.set(num, {
                  textParts: [formattedPart],
                  options: q.options || null,
                  type: examStage === 'prelims' ? 'MCQ' : 'Descriptive',
                });
              } else {
                groupedByNumber.get(num)!.textParts.push(formattedPart);
              }
            }

            for (const [qNum, qData] of groupedByNumber.entries()) {
              const unifiedText = qData.textParts.join('\n\n');
              let dbRetries = 3;
              while (dbRetries > 0) {
                try {
                  await prisma.pYQ.create({
                    data: {
                      year,
                      examStage: examStage.charAt(0).toUpperCase() + examStage.slice(1),
                      paper,
                      questionNumber: qNum,
                      questionText: unifiedText,
                      questionType: qData.type,
                      sourceFile: file,
                      confidence: 0.95,
                      optionsJson: qData.options ? JSON.stringify(qData.options) : null
                    }
                  });
                  break;
                } catch (dbErr: any) {
                  dbRetries--;
                  if (dbRetries === 0) throw dbErr;
                  console.log(`    [!] DB write retry (${dbRetries} left): ${dbErr.message?.slice(0, 80)}`);
                  await delay(2000);
                }
              }
            }
            result.questionsExtracted += groupedByNumber.size;
            result.totalImported++;

            let logRetries = 3;
            while (logRetries > 0) {
              try {
                await prisma.importLog.create({
                  data: { fileName: file, fileType: examStage, status: 'success', message: `Extracted ${questions.length} using Gemini File API` }
                });
                break;
              } catch (logErr) {
                logRetries--;
                if (logRetries === 0) console.warn('Could not write import log for:', file);
                await delay(1000);
              }
            }
          }
          
          // Small delay between PDFs to stay within RPM
          await delay(4500);

        } catch (err: any) {
          console.error(` -> Error processing ${file}:`, err.message);
          result.errors.push(`${file}: ${err.message}`);
        }
      }
    }
  }
  
  console.log('Import Complete!', result);
  return result;
}

async function extractQuestionsFromPDF(filePath: string, examStage: string) {
  // Step 1: Upload via Google AI File Manager (supports large PDFs up to 2GB)
  console.log(`    Uploading PDF via Google File API...`);
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType: 'application/pdf',
    displayName: path.basename(filePath),
  });
  
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
    "part": "a",
    "text": "The actual English question text...",
    "options": ["(a) Option 1", "(b) Option 2"]
  }
]
5. Only extract the question text, ignore administrative instructions (e.g. "Write on the following in about 150 words", "Maximum Marks").
6. Output raw JSON ONLY.`;

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const model = getModel();
      console.log(`    (Attempt ${attempt} - Querying model: ${MODELS[currentModelIndex]}...)`);
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          }
        },
        prompt
      ]);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      const cleanedJson = response.replace(/^```json/m, '').replace(/```$/m, '').trim();
      return JSON.parse(cleanedJson);
    } catch (e: any) {
      console.log(`    [!] Model ${MODELS[currentModelIndex]} error (retrying indefinitely): ${e.message?.slice(0, 120)}...`);
      rotateModel();
      const waitTime = e.message?.includes('429') ? 10000 : 4000;
      await delay(waitTime);
    }
  }
}

function identifyPaper(fileName: string, examStage: string): string {
  const fn = fileName.toLowerCase();
  if (examStage === 'prelims') {
    if (fn.includes('paper2') || fn.includes('paper-2') || fn.includes('paper_2') || fn.includes('csat')) return 'Paper 2 (CSAT)';
    return 'Paper 1 (GS)';
  }
  if (examStage === 'mains') {
    if (/(?:paper[\s\-_]*iv|gen(?:stud|eral[\s\-_]*studies)[\s\-_]*iv|_iv[_\.]|gs[\s\-_]*4|gen_st_p4)/i.test(fn)) return 'GS-IV';
    if (/(?:paper[\s\-_]*iii|gen(?:stud|eral[\s\-_]*studies)[\s\-_]*iii|_iii[_\.]|gs[\s\-_]*3|gen_st_p3)/i.test(fn)) return 'GS-III';
    if (/(?:paper[\s\-_]*ii|gen(?:stud|eral[\s\-_]*studies)[\s\-_]*ii|_ii[_\.]|gs[\s\-_]*2|gen_st_p2)/i.test(fn)) return 'GS-II';
    if (/(?:paper[\s\-_]*i(?![ivx])|gen(?:stud|eral[\s\-_]*studies)[\s\-_]*i(?![ivx])|_i[_\.]|gs[\s\-_]*1|gen_st_p1)/i.test(fn)) return 'GS-I';
    return 'GS-I';
  }
  if (examStage === 'essay') return 'Essay';
  if (examStage === 'sociology') {
    if (/(?:paper[\s\-_]*ii|2\.pdf|_ii[_\.])/i.test(fn)) return 'Sociology Paper-II';
    return 'Sociology Paper-I';
  }
  return 'Unknown';
}

export async function mapOfficialAnswerKeys() {
  console.log('Starting Official Answer Key Extraction from answers.pdf (2013-2026)...');
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const pdfPath = path.join(PYQ_DIRS.prelims, 'answer', 'answers.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('answers.pdf not found at:', pdfPath);
    return { success: false, error: 'File not found' };
  }

  const buf = fs.readFileSync(pdfPath);
  const part = {
    inlineData: {
      data: buf.toString('base64'),
      mimeType: 'application/pdf',
    },
  };

  const prompt = `This PDF contains official UPSC Prelims Answer Keys from 2013 to 2026 for Series A.
For every single year (2013 to 2026) and for both Paper-I (General Studies) and Paper-II (CSAT), extract the official answer for SET A (Series A).

CRITICAL RULES:
1. Extract Series A answers.
2. Support multi-option keys (e.g. "B, D" or "A, C") and dropped questions ("X").
3. Paper 1 has 100 questions (1 to 100). Paper 2 has 80 questions (1 to 80).

Return ONLY a JSON object:
{
  "keys": [
    {
      "year": 2013,
      "paper": "Paper 1 (GS)",
      "answers": {
        "1": "C",
        "2": "B",
        "100": "D"
      }
    },
    {
      "year": 2013,
      "paper": "Paper 2 (CSAT)",
      "answers": {
        "1": "A",
        "80": "C"
      }
    }
  ]
}`;

  try {
    const result = await model.generateContent([prompt, part]);
    const jsonText = result.response.text();
    const parsed = JSON.parse(jsonText);
    console.log(`Parsed ${parsed.keys?.length || 0} answer key papers from PDF.`);
    fs.writeFileSync(path.join(PYQ_DIRS.prelims, 'answer', 'parsed_keys.json'), JSON.stringify(parsed, null, 2));

    let updatedCount = 0;
    for (const item of (parsed.keys || [])) {
      const paperName = item.paper.includes('2') || item.paper.toLowerCase().includes('csat')
        ? 'Paper 2 (CSAT)'
        : 'Paper 1 (GS)';

      for (const [qNumStr, ans] of Object.entries(item.answers || {})) {
        const qNum = parseInt(qNumStr, 10);
        if (!isNaN(qNum)) {
          let retry = 3;
          while (retry > 0) {
            try {
              const res = await prisma.pYQ.updateMany({
                where: {
                  year: item.year,
                  examStage: 'Prelims',
                  paper: paperName,
                  questionNumber: qNum,
                },
                data: {
                  correctAnswer: String(ans).trim(),
                },
              });
              updatedCount += res.count;
              break;
            } catch (err) {
              retry--;
              if (retry === 0) console.warn(`Failed to update key for ${item.year} Q.${qNum}`);
              await delay(1000);
            }
          }
        }
      }
      console.log(`  ✓ Synced answer keys for: [${item.year}] ${paperName}`);
      await delay(300);
    }

    console.log(`\n🎉 Answer Key Mapping Complete! Updated ${updatedCount} PYQ records with official keys.`);
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Error in mapOfficialAnswerKeys:', error);
    return { success: false, error: error.message };
  }
}

