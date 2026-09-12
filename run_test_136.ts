import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
const chapterId = 136;
const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, include: { book: { include: { subject: true } } } });
console.log('Processing chapter:', chapter.title);
const userPrompt = 'Analyze this NCERT chapter in full depth for UPSC CSE 2027:\n- Subject: ' + chapter.book.subject.name + ' | Book: ' + chapter.book.title + ' (Class ' + chapter.book.className + ') | Chapter ' + chapter.number + ': ' + chapter.title + '\n- Complete Chapter Content: ' + (chapter.content || chapter.summary || '');
const systemPrompt = 'You are an expert UPSC CSE faculty and content analyzer. Your task is to extract all critical exam-relevant information from the provided NCERT chapter.\n\nReturn ONLY a raw JSON object with this exact structure (no markdown, no backticks, no markdown code block formatting, just the raw JSON):\n{ "keyConcepts": [ { "name": "Concept", "description": "Explanation", "importance": "high|medium|low", "upscRelevance": "Why it matters" } ], "definitions": [ { "term": "Term", "definition": "Clear meaning" } ], "findOutQuestions": [ { "question": "Question text from chapter", "answer": "Factual answer" } ] }';
const geminiModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
const geminiApiKey = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
let parsedData = null;
let modelUsed = '';
if (geminiApiKey) {
for (const modelName of geminiModels) {
console.log('Trying model:', modelName);
let success = false;
for (let attempt = 1; attempt <= 5; attempt++) {
console.log(' Attempt', attempt);
try {
const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey }, body: JSON.stringify({ contents: [{ parts: [{ text: userPrompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: 'application/json' } }) });
if (!res.ok) { console.log('   HTTP Error:', res.status, res.statusText); const errText = await res.text(); console.log('   Body:', errText.substring(0, 200)); if (res.status === 503 || res.status === 429) { await new Promise(r => setTimeout(r, 2000)); continue; } break; }
const json = await res.json();
if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
let text = json.candidates[0].content.parts[0].text;
console.log('   Received response of length', text.length);
console.log('   Starts with:', text.substring(0, 30));
console.log('   Ends with:', text.substring(text.length - 30));
text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
try {
parsedData = JSON.parse(text);
modelUsed = modelName;
success = true;
console.log('   SUCCESSfully parsed JSON with', modelName);
break;
} catch (parseErr) { console.log('   Gemini JSON Parse Error:', parseErr.message); }
}
} catch (e) { console.log('   Fetch error:', e.message); }
}
if (success) break;
}
}
if (!parsedData) { console.log('ALL MODELS FAILED.'); } else { console.log('Final Model Used:', modelUsed); }
}
run();
