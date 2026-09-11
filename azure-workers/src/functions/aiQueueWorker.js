"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiQueueWorker = aiQueueWorker;
const functions_1 = require("@azure/functions");
const client_1 = require("@libsql/client");
async function aiQueueWorker(queueItem, context) {
    context.log('Storage queue function processed work item:', queueItem);
    if (!queueItem || !queueItem.chapterId || !queueItem.task) {
        context.log('Invalid queue item, skipping.');
        return;
    }
    const { chapterId, task } = queueItem;
    const dbUrl = process.env.TURSO_URL;
    const dbToken = process.env.TURSO_AUTH_TOKEN;
    if (!dbUrl) {
        context.log('TURSO_URL not found');
        return;
    }
    const db = (0, client_1.createClient)({ url: dbUrl, authToken: dbToken });
    try {
        if (task === 'analyze_chapter') {
            await handleAnalyzeChapter(db, chapterId, context);
        }
        else if (task === 'generate_pyqs') {
            await handleGeneratePYQs(db, chapterId, context);
        }
    }
    catch (err) {
        context.log('Error processing task:', err);
        throw err; // Trigger Azure Queue's automatic retry
    }
}
async function handleAnalyzeChapter(db, chapterId, context) {
    context.log(`Running Analyze Chapter for ID ${chapterId}`);
    const rs = await db.execute({
        sql: `SELECT c.content, c.summary, b.title as bookTitle, b.className, s.name as subjectName, c.number, c.title as chapterTitle
              FROM Chapter c JOIN Book b ON c.bookId = b.id JOIN Subject s ON b.subjectId = s.id 
              WHERE c.id = ?`,
        args: [chapterId]
    });
    if (rs.rows.length === 0)
        throw new Error('Chapter not found');
    const chapter = rs.rows[0];
    const systemPrompt = `You are an expert UPSC CSE (Civil Services Exam) faculty...
Extract: 1. Core arguments 2. NCERT data traps 3. Mains enrichment 4. Map Work 5. Diagrams
Return ONLY valid JSON matching this schema:
{
  "relevance": "string",
  "highYieldSummary": ["string"],
  "prelimsFocus": ["string"],
  "mainsAngles": [{"question": "string", "framework": "string"}],
  "caseStudiesAndData": ["string"],
  "keyDefinitions": [{"term": "string", "definition": "string"}],
  "mapWork": ["string"],
  "diagramsToDraw": ["string"]
}`;
    const userPrompt = `Analyze this NCERT chapter in full depth for UPSC CSE 2027:
- Subject: ${chapter.subjectName} | Book: ${chapter.bookTitle} (Class ${chapter.className}) | Chapter ${chapter.number}: ${chapter.chapterTitle}
- Complete Chapter Content: ${chapter.content || chapter.summary || ''}`;
    let parsedData = null;
    let modelUsed = '';
    const geminiModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
        for (const modelName of geminiModels) {
            let success = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
                            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
                        })
                    });
                    const json = await res.json();
                    if (res.ok && json.candidates?.[0]?.content?.parts?.[0]?.text) {
                        parsedData = JSON.parse(json.candidates[0].content.parts[0].text);
                        modelUsed = modelName;
                        success = true;
                        break;
                    }
                    if (res.status === 503)
                        await new Promise(r => setTimeout(r, 1200));
                }
                catch (e) { }
            }
            if (success)
                break;
        }
    }
    if (!parsedData && process.env.GROQ_API_KEY) {
        try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                    response_format: { type: 'json_object' }, temperature: 0.2
                })
            });
            const groqJson = await groqRes.json();
            if (groqJson.choices?.[0]?.message?.content) {
                parsedData = JSON.parse(groqJson.choices[0].message.content);
                modelUsed = 'Groq LLaMA 3.1 8B';
            }
        }
        catch (e) { }
    }
    if (!parsedData)
        throw new Error('Failed to generate analysis across all AI models.');
    await db.execute({
        sql: `UPDATE Chapter SET summary = ?, definitionsJson = ?, keyConceptsJson = ? WHERE id = ?`,
        args: [
            JSON.stringify({
                highYieldSummary: parsedData.highYieldSummary || [],
                mainsAngles: parsedData.mainsAngles || [],
                caseStudiesAndData: parsedData.caseStudiesAndData || [],
                mapWork: parsedData.mapWork || [],
                diagramsToDraw: parsedData.diagramsToDraw || [],
                relevance: parsedData.relevance || 'GS / Prelims',
                modelUsed: modelUsed
            }),
            JSON.stringify(parsedData.keyDefinitions || []),
            JSON.stringify(parsedData.prelimsFocus || []),
            chapterId
        ]
    });
    context.log('Saved analyze chapter results.');
}
async function handleGeneratePYQs(db, chapterId, context) {
    context.log(`Running Generate PYQs for ID ${chapterId}`);
    const rsChap = await db.execute({ sql: `SELECT summary, keyConceptsJson, definitionsJson FROM Chapter WHERE id = ?`, args: [chapterId] });
    if (rsChap.rows.length === 0)
        throw new Error('Chapter not found');
    const chapter = rsChap.rows[0];
    const rsTopics = await db.execute({ sql: `SELECT t.name FROM SyllabusTopic t JOIN _ChapterTopic ct ON t.id = ct.B WHERE ct.A = ?`, args: [chapterId] });
    const topicsString = rsTopics.rows.map((r) => r.name).join(', ');
    const rsPyqs = await db.execute({ sql: `SELECT p.questionText, p.correctAnswer, p.questionType FROM pyqs p JOIN _ChapterPYQ cp ON p.id = cp.B WHERE cp.A = ? AND p.isAiGenerated = 0 LIMIT 10`, args: [chapterId] });
    let pyqContext = '';
    if (rsPyqs.rows.length > 0) {
        pyqContext = 'REAL UPSC PYQ REFERENCE (Match this style, complexity, and difficulty):\n' +
            rsPyqs.rows.map((q, i) => `Q${i + 1}: ${q.questionText}\nAns: ${q.correctAnswer}\nType: ${q.questionType || 'MCQ'}`).join('\n\n');
    }
    const nvidiaKey = process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY_2;
    if (!nvidiaKey)
        throw new Error('NVIDIA API Key not configured');
    const modelName = 'nvidia/nemotron-3-super-120b-a12b';
    const genPrompt = `You are an elite UPSC CSE paper setter. Your task is to generate 25 highly challenging, UPSC-level practice questions based EXACTLY on the knowledge provided below.
KNOWLEDGE BASE:
Topics: ${topicsString}
Chapter Summary: ${chapter.summary}
Key Concepts: ${chapter.keyConceptsJson}
Definitions: ${chapter.definitionsJson}

${pyqContext}

INSTRUCTIONS:
1. Generate 25 candidate questions matching UPSC Prelims style (Multi-statement, Assertion-Reasoning).
2. Do NOT invent facts outside the Knowledge Base.
3. Return ONLY a valid JSON array of objects.

JSON SCHEMA:
[{"questionText": "...","options": ["A) ...", "B) ...", "C) ...", "D) ..."],"correctAnswer": "A","explanation": "..."}]`;
    let genRes;
    try {
        genRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${nvidiaKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName, messages: [{ role: 'user', content: genPrompt }], temperature: 0.3, max_tokens: 3500 })
        });
    }
    catch (e) {
        throw new Error('NVIDIA generation API request failed');
    }
    if (!genRes.ok)
        throw new Error('NVIDIA generation API returned error: ' + genRes.statusText);
    const genJson = await genRes.json();
    const genContent = genJson.choices?.[0]?.message?.content;
    let candidates = [];
    try {
        const match = genContent.match(/\[[\s\S]*\]/);
        candidates = JSON.parse(match ? match[0] : genContent);
    }
    catch (e) {
        throw new Error('Failed to parse generation JSON');
    }
    const valPrompt = `You are a strict UPSC question-quality evaluator. I will give you a list of candidate questions.
Your task is to REJECT questions that are factually questionable, ambiguous, too trivial, or do not have a uniquely defensible answer.
Select the BEST 20 questions and return them as a valid JSON array.
CANDIDATES:
${JSON.stringify(candidates)}
RETURN STRICTLY JSON MATCHING:
[{"questionText": "...","options": ["A) ...", "B) ...", "C) ...", "D) ..."],"correctAnswer": "...","explanation": "..."}]`;
    let valRes;
    try {
        valRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${nvidiaKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName, messages: [{ role: 'user', content: valPrompt }], temperature: 0.1, max_tokens: 3000 })
        });
    }
    catch (e) {
        throw new Error('NVIDIA validation API request failed');
    }
    if (!valRes.ok)
        throw new Error('NVIDIA validation API failed');
    const valJson = await valRes.json();
    const valContent = valJson.choices?.[0]?.message?.content;
    let finalQuestions = [];
    try {
        const match = valContent.match(/\[[\s\S]*\]/);
        finalQuestions = JSON.parse(match ? match[0] : valContent);
    }
    catch (e) {
        finalQuestions = candidates.slice(0, 20);
    }
    finalQuestions = finalQuestions.slice(0, 20);
    const year = new Date().getFullYear();
    const ts = new Date().toISOString();
    for (let i = 0; i < finalQuestions.length; i++) {
        const q = finalQuestions[i];
        const res = await db.execute({
            sql: `INSERT INTO pyqs (year, examStage, paper, questionNumber, questionText, optionsJson, correctAnswer, explanation, difficulty, questionType, sourceFile, isAiGenerated, aiModel, createdAt)
                  VALUES (?, 'Prelims', 'GS', ?, ?, ?, ?, ?, 'Medium', 'MCQ', 'AI Generator', 1, ?, ?) RETURNING id`,
            args: [year, i + 1, q.questionText, JSON.stringify(q.options || []), q.correctAnswer, q.explanation, modelName, ts]
        });
        await db.execute({ sql: `INSERT INTO _ChapterPYQ (A, B) VALUES (?, ?)`, args: [chapterId, res.rows[0].id] });
    }
    context.log('Successfully saved generated PYQs.');
}
functions_1.app.storageQueue('aiQueueWorker', {
    queueName: 'ai-tasks-queue',
    connection: 'AzureWebJobsStorage',
    handler: aiQueueWorker
});
//# sourceMappingURL=aiQueueWorker.js.map