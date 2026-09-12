const apiKey = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
const userPrompt = `Analyze this NCERT chapter in full depth for UPSC CSE 2027:
- Subject: Geography | Book: Contemporary India I (Class 9) | Chapter 3: Drainage
- Complete Chapter Content: CHAPTER 3 Drainage17`;
const sysPrompt = `You are an expert UPSC CSE (Civil Services Exam) faculty...
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
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: sysPrompt }] },
    generationConfig: { responseMimeType: 'application/json' }
  })
}).then(r=>r.json()).then(j => console.log(JSON.stringify(j, null, 2)));