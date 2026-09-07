import * as fs from 'fs';
import * as path from 'path';

export interface HistoricalPYQ {
  id: number;
  sourceFile: string;
  year: number;
  examStage: string;
  questionText: string;
  questionType?: string;
  answer?: string | null;
  sectionHint?: string;
  tokens: Set<string>;
}

export interface StyleExample {
  year: number;
  questionText: string;
  answer?: string | null;
  questionType?: string;
}

export interface LexicalSimilarityResult {
  score: number;
  matchedId: number;
  matchedText: string;
}

const PYQ_DIR = path.resolve('E:/books/apfc/structured/jsonfiels');

const PYQ_FILES = [
  { file: 'EPFO_APFC_EO_AO_2025_structured_questions.json', year: 2025, stage: 'EPFO APFC' },
  { file: 'EPFO_APFC_EO_AO_2023_structured_questions.json', year: 2023, stage: 'EPFO APFC' },
  { file: 'EPFO_APFC_EO_AO_2021_structured_questions.json', year: 2021, stage: 'EPFO APFC' },
  { file: 'EPFO_APFC_EO_AO_2017_structured_questions.json', year: 2017, stage: 'EPFO EO/AO' },
  { file: 'EPFO_APFC_EO_AO_2016_structured_questions.json', year: 2016, stage: 'EPFO EO/AO' },
  { file: 'EPFO_APFC_EO_AO_2012_structured_questions.json', year: 2012, stage: 'EPFO EO/AO' },
];

const STOP_WORDS = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','of','in','on','at','to','for','with','by','from','up','about','into','that','this','these','those','it','its','which','who','what','when','where','how','and','or','but','not','no','as','if','so','then','than','such','both','each','any','all','most','some','other','more','also','only','just','very','well','select','code','given','below','above','correct','following','answer','option','statement','statements','one','two','three','four','five','six','seven','eight']);

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function extractTextFromContent(content: any[]): string {
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (block.text) parts.push(block.text);
    if (block.items && Array.isArray(block.items)) {
      for (const item of block.items) {
        if (typeof item === 'string') parts.push(item);
        else if (item.text) parts.push(item.text);
        else if (item.item) parts.push(item.item);
      }
    }
    if (block.title) parts.push(block.title);
  }
  return parts.join(' ');
}

let _cachedPYQs: HistoricalPYQ[] | null = null;

export function loadHistoricalPYQs(): HistoricalPYQ[] {
  if (_cachedPYQs) return _cachedPYQs;
  const allPYQs: HistoricalPYQ[] = [];
  let globalId = 1;

  for (const { file, year, stage } of PYQ_FILES) {
    const filePath = path.join(PYQ_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[pyq-retriever-mock] File not found: ${filePath}`);
      continue;
    }
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const questions = raw.questions || [];
      for (const q of questions) {
        const qText = typeof q.questionText === 'string' ? q.questionText : extractTextFromContent(q.content || []);
        if (!qText || qText.trim().length < 10) continue;
        allPYQs.push({
          id: globalId++, sourceFile: file, year, examStage: stage,
          questionText: qText.slice(0, 500), questionType: q.question_type, answer: q.answer ?? null,
          tokens: tokenize(qText),
        });
      }
    } catch (err) { console.error(`[pyq-retriever-mock] Failed to parse ${file}:`, err); }
  }
  _cachedPYQs = allPYQs;
  return _cachedPYQs;
}

export function getStyleExamples(sectionId: string, subtopic: string, archetype: string, n: number = 2): StyleExample[] {
  const pyqs = loadHistoricalPYQs();
  const searchTokens = new Set([...sectionId.toLowerCase().replace(/_/g, ' ').split(' '), ...subtopic.toLowerCase().replace(/_/g, ' ').split(' ')].filter(w => w.length > 3));
  const archetypeTypeMap: Record<string, string[]> = { 'A01': ['statement_based', 'mcq'], 'A02': ['statement_based', 'mcq'], 'A03': ['matching', 'mcq'], 'A04': ['assertion_reason', 'mcq'], 'A09': ['passage_question'] };
  const preferredTypes = archetypeTypeMap[archetype] || ['mcq'];

  const scored = pyqs.map(pyq => {
    let score = 0;
    for (const t of searchTokens) { if (pyq.tokens.has(t)) score += 2; }
    if (pyq.questionType && preferredTypes.some(t => pyq.questionType!.includes(t))) score += 3;
    score += (pyq.year - 2010) * 0.1;
    return { pyq, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map(({ pyq }) => ({ year: pyq.year, questionText: pyq.questionText, answer: pyq.answer, questionType: pyq.questionType }));
}

export function findLexicalSimilarity(candidateText: string): LexicalSimilarityResult {
  const pyqs = loadHistoricalPYQs();
  const candidateTokens = tokenize(candidateText);
  let bestScore = 0; let bestId = -1; let bestText = '';
  for (const pyq of pyqs) {
    let intersection = 0;
    for (const t of candidateTokens) { if (pyq.tokens.has(t)) intersection++; }
    const union = candidateTokens.size + pyq.tokens.size - intersection;
    const score = union === 0 ? 0 : intersection / union;
    if (score > bestScore) { bestScore = score; bestId = pyq.id; bestText = pyq.questionText; }
  }
  return { score: bestScore, matchedId: bestId, matchedText: bestText };
}

export function getAllPYQTexts(): string[] { return loadHistoricalPYQs().map(p => p.questionText); }
