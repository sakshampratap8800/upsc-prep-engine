import { GeneratedQuestion } from './generator';

export interface ValidationResult {
  tempId: string;
  valid: boolean;
  issues: string[];
}

export function validateStructural(q: GeneratedQuestion): ValidationResult {
  const issues: string[] = [];
  if (!q.questionText || q.questionText.trim().length < 10) issues.push('Question text too short or missing');
  if (!Array.isArray(q.optionsJson) || q.optionsJson.length !== 4) issues.push('Must have exactly 4 options');
  if (!['A','B','C','D'].includes(q.correctAnswer)) issues.push('correctAnswer must be A, B, C, or D');
  if (q.optionsJson?.some((o: string) => !o || o.trim().length < 2)) issues.push('One or more options are empty');
  const uniqueOptions = new Set(q.optionsJson?.map((o: string) => o.trim().toLowerCase()));
  if (uniqueOptions.size < 4) issues.push('Duplicate options detected');
  if (!q.primarySection || !q.subtopic) issues.push('Missing section or subtopic metadata');
  return { tempId: q.tempId, valid: issues.length === 0, issues };
}

async function callNVIDIA120B(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not set');
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`NVIDIA 120B validation error ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

async function callGeminiFallback(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini fallback validation failed ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

const VALIDATION_SYSTEM_PROMPT = `You are an expert UPSC EPFO examination paper setter and quality validator.
Your ONLY job is to validate each question for:
1. Factual/legal/statutory accuracy
2. Single defensible correct answer
3. Plausible but clearly wrong distractors
4. No ambiguity

Return ONLY a JSON array: [{"id": "<tempId>", "valid": true/false, "issues": ["..."]}]
Do NOT explain in prose. Be strict.`;

function buildValidationPrompt(batch: GeneratedQuestion[]): string {
  const questionsList = batch.map(q =>
    `ID: ${q.tempId}\nSection: ${q.primarySection}\nSubtopic: ${q.subtopic}\nDifficulty: ${q.difficulty}\nQ: ${q.questionText}\nA: ${q.optionsJson[0]}\nB: ${q.optionsJson[1]}\nC: ${q.optionsJson[2]}\nD: ${q.optionsJson[3]}\nCorrect: ${q.correctAnswer}`
  ).join('\n\n---\n\n');
  return `Validate these ${batch.length} questions. Return JSON array only.\n\n${questionsList}`;
}

function parseValidationOutput(raw: string, batch: GeneratedQuestion[]): ValidationResult[] {
  const fallbackValid = batch.map(q => ({ tempId: q.tempId, valid: true, issues: [] }));
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return fallbackValid;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return fallbackValid;
    const resultMap = new Map(parsed.map((r: any) => [r.id, r]));
    return batch.map(q => {
      const r = resultMap.get(q.tempId);
      if (!r) return { tempId: q.tempId, valid: true, issues: [] };
      return { tempId: q.tempId, valid: Boolean(r.valid), issues: Array.isArray(r.issues) ? r.issues : [] };
    });
  } catch { return fallbackValid; }
}

export async function validateBatch(
  candidates: GeneratedQuestion[],
  batchSize: number = 15,
  onProgress?: (msg: string) => void
): Promise<ValidationResult[]> {
  const allResults: ValidationResult[] = [];

  const structuralResults = candidates.map(validateStructural);
  const structurallyValid = candidates.filter((_, i) => structuralResults[i].valid);
  const structurallyInvalid = structuralResults.filter(r => !r.valid);
  allResults.push(...structurallyInvalid);

  onProgress?.(`Structural validation: ${structurallyValid.length} passed, ${structurallyInvalid.length} rejected`);

  if (structurallyValid.length === 0) return allResults;

  const batches: GeneratedQuestion[][] = [];
  for (let i = 0; i < structurallyValid.length; i += batchSize) {
    batches.push(structurallyValid.slice(i, i + batchSize));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    onProgress?.(`LLM validation batch ${i + 1}/${batches.length} (${batch.length} questions)...`);

    const userPrompt = buildValidationPrompt(batch);
    let rawOutput = '';

    try {
      rawOutput = await callNVIDIA120B(VALIDATION_SYSTEM_PROMPT, userPrompt);
    } catch (err) {
      console.warn(`[validator] 120B failed for batch ${i}, trying Gemini fallback:`, err);
      try { rawOutput = await callGeminiFallback(VALIDATION_SYSTEM_PROMPT, userPrompt); }
      catch { allResults.push(...batch.map(q => ({ tempId: q.tempId, valid: true, issues: [] }))); continue; }
    }

    const batchResults = parseValidationOutput(rawOutput, batch);
    allResults.push(...batchResults);

    const passed = batchResults.filter(r => r.valid).length;
    onProgress?.(`  -> Batch ${i + 1}: ${passed}/${batch.length} passed`);

    if (i < batches.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  return allResults;
}
