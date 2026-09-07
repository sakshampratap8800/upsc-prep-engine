import { GeneratedQuestion } from './generator';
import { findLexicalSimilarity } from './pyq-retriever-mock';

export interface NoveltyResult {
  tempId: string;
  status: 'passed' | 'rejected';
  lexicalScore: number;
  embeddingScore?: number;
  similarPYQText?: string;
  reason?: string;
}

const LEXICAL_AUTO_REJECT = 0.65;
const LEXICAL_AUTO_PASS = 0.20;
const EMBEDDING_REJECT = 0.88;

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set for embeddings');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text: text.slice(0, 1000) }] } }),
  });
  if (!res.ok) throw new Error(`Embedding API error ${res.status}`);
  const data = await res.json();
  return data.embedding?.values || [];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function llmParaphraseCheck(candidate: string, existing: string): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;
  try {
    const prompt = `Is Question 2 a paraphrase or near-duplicate of Question 1? Return JSON: {"is_duplicate": true/false}\n\nQuestion 1: ${existing.slice(0, 300)}\n\nQuestion 2: ${candidate.slice(0, 300)}`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(text);
    return Boolean(parsed.is_duplicate);
  } catch { return false; }
}

let _pyqEmbeddingCache: Array<{ text: string; embedding: number[] }> | null = null;

async function getPYQEmbeddings(pyqTexts: string[]): Promise<Array<{ text: string; embedding: number[] }>> {
  if (_pyqEmbeddingCache) return _pyqEmbeddingCache;
  const results: Array<{ text: string; embedding: number[] }> = [];
  const sample = pyqTexts.filter((_, i) => i % 5 === 0);
  for (let i = 0; i < sample.length; i += 20) {
    const batch = sample.slice(i, i + 20);
    for (const text of batch) {
      try {
        const embedding = await getEmbedding(text);
        results.push({ text, embedding });
      } catch { /* skip */ }
    }
    if (i + 20 < sample.length) await new Promise(r => setTimeout(r, 200));
  }
  _pyqEmbeddingCache = results;
  return results;
}

export async function runNoveltyFilter(
  candidates: GeneratedQuestion[],
  onProgress?: (msg: string) => void
): Promise<NoveltyResult[]> {
  const results: NoveltyResult[] = [];
  let passedCount = 0; let rejectedCount = 0; let embeddingReviewCount = 0;

  onProgress?.(`Running lexical novelty check on ${candidates.length} candidates...`);

  const needsEmbedding: GeneratedQuestion[] = [];
  const lexicalResults: Array<{ q: GeneratedQuestion; lexScore: number; matchedText: string }> = [];

  for (const q of candidates) {
    const { score, matchedText } = findLexicalSimilarity(q.questionText);
    lexicalResults.push({ q, lexScore: score, matchedText });
    if (score >= LEXICAL_AUTO_REJECT) {
      results.push({ tempId: q.tempId, status: 'rejected', lexicalScore: score, similarPYQText: matchedText, reason: `Lexical near-duplicate (score ${score.toFixed(2)})` });
      rejectedCount++;
    } else if (score <= LEXICAL_AUTO_PASS) {
      results.push({ tempId: q.tempId, status: 'passed', lexicalScore: score });
      passedCount++;
    } else {
      needsEmbedding.push(q);
    }
  }

  onProgress?.(`Lexical: ${passedCount} passed, ${rejectedCount} rejected, ${needsEmbedding.length} need embedding review`);

  if (needsEmbedding.length === 0) return results;

  onProgress?.(`Computing embedding similarity for ${needsEmbedding.length} borderline candidates...`);

  let pyqEmbeddings: Array<{ text: string; embedding: number[] }> = [];
  try {
    const { getAllPYQTexts } = await import('./pyq-retriever-mock');
    pyqEmbeddings = await getPYQEmbeddings(getAllPYQTexts());
  } catch (err) {
    console.warn('[novelty-filter] Could not compute PYQ embeddings:', err);
    for (const q of needsEmbedding) {
      const lex = lexicalResults.find(r => r.q.tempId === q.tempId);
      results.push({ tempId: q.tempId, status: 'passed', lexicalScore: lex?.lexScore || 0 });
    }
    return results;
  }

  const needsLLMReview: Array<{ q: GeneratedQuestion; lexScore: number; embeddingScore: number; matchedText: string }> = [];

  for (const q of needsEmbedding) {
    const lex = lexicalResults.find(r => r.q.tempId === q.tempId);
    let maxEmbeddingScore = 0;
    let closestText = '';

    try {
      const candidateEmb = await getEmbedding(q.questionText);
      for (const { text, embedding } of pyqEmbeddings) {
        const sim = cosineSimilarity(candidateEmb, embedding);
        if (sim > maxEmbeddingScore) { maxEmbeddingScore = sim; closestText = text; }
      }
    } catch { maxEmbeddingScore = 0; }

    if (maxEmbeddingScore >= EMBEDDING_REJECT) {
      needsLLMReview.push({ q, lexScore: lex?.lexScore || 0, embeddingScore: maxEmbeddingScore, matchedText: closestText });
      embeddingReviewCount++;
    } else {
      results.push({ tempId: q.tempId, status: 'passed', lexicalScore: lex?.lexScore || 0, embeddingScore: maxEmbeddingScore });
      passedCount++;
    }
  }

  onProgress?.(`Embedding: ${embeddingReviewCount} sent to LLM paraphrase review`);

  for (const { q, lexScore, embeddingScore, matchedText } of needsLLMReview) {
    const isDuplicate = await llmParaphraseCheck(q.questionText, matchedText);
    if (isDuplicate) {
      results.push({ tempId: q.tempId, status: 'rejected', lexicalScore: lexScore, embeddingScore, similarPYQText: matchedText, reason: 'LLM confirmed near-duplicate' });
      rejectedCount++;
    } else {
      results.push({ tempId: q.tempId, status: 'passed', lexicalScore: lexScore, embeddingScore });
      passedCount++;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  onProgress?.(`Novelty filter complete: ${passedCount} passed, ${rejectedCount} rejected`);
  return results;
}
