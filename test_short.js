const apiKey = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Analyze this:'}] }],
    generationConfig: { responseMimeType: 'application/json' }
  })
}).then(r=>r.json()).then(console.log);