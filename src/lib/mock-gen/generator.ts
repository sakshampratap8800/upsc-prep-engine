import { QuestionSlot } from './slot-planner';
import { getStyleExamples } from './pyq-retriever-mock';
import { getMasterSystemPrompt } from './config';

export interface GeneratedQuestion {
  tempId: string;
  slotId: number;
  primarySection: string;
  sectionTitle: string;
  subtopic: string;
  archetype: string;
  difficulty: string;
  currentAffairs: boolean;
  generatedBy: string;
  questionText: string;
  optionsJson: string[];
  correctAnswer: string;
  passageText?: string;
}

const DOMAIN_SECTIONS = new Set([
  '9_industrial_relations_labour_laws',
  '10_social_security',
  '11_accountancy_auditing',
  '12_insurance',
]);

const ENGLISH_SECTION = '1_general_english';
const CURRENT_AFFAIRS_SECTION = '13_current_events';

async function callNVIDIA(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not set');
  const modelId = model === '120b'
    ? 'nvidia/nemotron-3-super-120b-a12b'
    : 'nvidia/nemotron-3.5-lightning-30b-a3b';
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ model: modelId, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.7, max_tokens: 4000 }),
  });
  if (!res.ok) throw new Error('NVIDIA API error ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

async function callGeminiFlash(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  for (const modelName of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch { continue; }
  }
  throw new Error('All Gemini Flash models failed');
}

function buildBatchPrompt(slots: QuestionSlot[]): string {
  const sectionId = slots[0].primarySection;
  const sectionTitle = slots[0].sectionTitle;
  const subtopicMap = new Map<string, { slots: QuestionSlot[]; keyConcepts: string[]; importantPoints: string[] }>();
  for (const slot of slots) {
    if (!subtopicMap.has(slot.subtopic)) {
      subtopicMap.set(slot.subtopic, { slots: [], keyConcepts: slot.syllabusSlice.keyConcepts, importantPoints: slot.syllabusSlice.importantPoints });
    }
    subtopicMap.get(slot.subtopic)!.slots.push(slot);
  }
  const examples = getStyleExamples(sectionId, slots[0].subtopic, slots[0].archetype, 2);
  const examplesStr = examples.map((e, i) =>
    `[Style Example ${i + 1} - ${e.year}] ${e.questionText.slice(0, 200)}${e.answer ? ` | Answer: ${e.answer}` : ''}`
  ).join('\n\n');
  const taskLines: string[] = [];
  for (const [subtopic, { slots: stSlots, keyConcepts, importantPoints }] of subtopicMap) {
    const diffCounts: Record<string, number> = {};
    stSlots.forEach(s => { diffCounts[s.targetDifficulty] = (diffCounts[s.targetDifficulty] || 0) + 1; });
    const archetypes = [...new Set(stSlots.map(s => s.archetype))];
    taskLines.push([
      `SUBTOPIC: ${subtopic}`,
      `Generate: ${stSlots.length} questions`,
      `Difficulty: ${JSON.stringify(diffCounts)}`,
      `Archetypes: ${archetypes.join(', ')}`,
      `Key Concepts: ${keyConcepts.slice(0, 6).join(' | ')}`,
      `Distractor basis: ${importantPoints.slice(0, 4).join(' | ')}`,
    ].join('\n'));
  }
  const overgen = Math.ceil(slots.length * 1.25);
  const slotList = slots.map(s => `slotId ${s.slotId} -> ${s.subtopic} (${s.targetDifficulty})`).join('\n');
  const outputSchema = JSON.stringify({ slotId: '<number>', questionText: '<stem only no options>', optionsJson: ['<A>', '<B>', '<C>', '<D>'], correctAnswer: '<A|B|C|D>', archetype: '<code>', difficulty: '<easy|moderate|hard|very_hard>', subtopic: '<name>' }, null, 2);
  return [
    `EXAM SECTION: ${sectionTitle}`,
    `QUESTIONS NEEDED: ${slots.length} (generate ${overgen} candidates)`,
    '',
    taskLines.join('\n\n'),
    '',
    'STYLE REFERENCE (mimic format, do NOT copy content):',
    examplesStr || 'No style examples available.',
    '',
    'OUTPUT: JSON array. Each element:',
    outputSchema,
    '',
    'SLOT ASSIGNMENTS:',
    slotList,
    '',
    'RULES: Exactly 4 options. Exactly 1 correct answer. No explanations. All within 2026 APFC syllabus. Return ONLY the JSON array.',
  ].join('\n');
}

function parseLLMOutput(raw: string, slots: QuestionSlot[], model: string): GeneratedQuestion[] {
  const results: GeneratedQuestion[] = [];
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) { console.warn('[generator] No JSON array in output'); return results; }
  let parsed: any[];
  try { parsed = JSON.parse(jsonMatch[0]); } catch { console.warn('[generator] JSON parse failed'); return results; }
  const slotMap = new Map(slots.map(s => [s.slotId, s]));
  for (const item of parsed) {
    if (!item.questionText || !Array.isArray(item.optionsJson) || item.optionsJson.length !== 4) continue;
    if (!['A','B','C','D'].includes(String(item.correctAnswer || '').toUpperCase())) continue;
    const slot = slotMap.get(item.slotId) || slots[results.length] || slots[0];
    results.push({
      tempId: `gen_${slot.slotId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      slotId: slot.slotId,
      primarySection: slot.primarySection,
      sectionTitle: slot.sectionTitle,
      subtopic: item.subtopic || slot.subtopic,
      archetype: item.archetype || slot.archetype,
      difficulty: item.difficulty || slot.targetDifficulty,
      currentAffairs: slot.currentAffairs,
      generatedBy: model,
      questionText: String(item.questionText).trim(),
      optionsJson: item.optionsJson.map((o: any) => String(o).trim()),
      correctAnswer: String(item.correctAnswer).toUpperCase(),
      passageText: item.passageText || undefined,
    });
  }
  return results;
}

export async function generateBatch(slots: QuestionSlot[], onProgress?: (msg: string) => void): Promise<GeneratedQuestion[]> {
  if (slots.length === 0) return [];
  const sectionId = slots[0].primarySection;
  const sectionTitle = slots[0].sectionTitle;
  const hasHard = slots.some(s => s.targetDifficulty === 'hard' || s.targetDifficulty === 'very_hard');
  const isDomain = DOMAIN_SECTIONS.has(sectionId);
  let modelKey = 'gemini-flash';
  if (sectionId !== CURRENT_AFFAIRS_SECTION && sectionId !== ENGLISH_SECTION) {
    if (hasHard) modelKey = '120b';
    else if (isDomain) modelKey = '30b';
  } else if (hasHard) {
    modelKey = '120b';
  }
  const modelLabel = modelKey === 'gemini-flash' ? 'Gemini Flash' : modelKey === '120b' ? 'Nemotron 120B' : 'Nemotron 30B';
  onProgress?.(`Generating ${slots.length} candidates for "${sectionTitle}" via ${modelLabel}...`);
  const systemPrompt = getMasterSystemPrompt();
  const userPrompt = buildBatchPrompt(slots);
  let rawOutput = '';
  let usedModel = modelKey;
  try {
    rawOutput = modelKey === 'gemini-flash' ? await callGeminiFlash(systemPrompt, userPrompt) : await callNVIDIA(modelKey, systemPrompt, userPrompt);
  } catch (err) {
    console.warn(`[generator] ${modelKey} failed, falling back to Gemini Flash:`, err);
    try { rawOutput = await callGeminiFlash(systemPrompt, userPrompt); usedModel = 'gemini-flash (fallback)'; }
    catch (err2) { console.error('[generator] All models failed for section:', sectionId, err2); return []; }
  }
  const generated = parseLLMOutput(rawOutput, slots, usedModel);
  onProgress?.(`  -> ${generated.length} candidates generated for "${sectionTitle}"`);
  return generated;
}
