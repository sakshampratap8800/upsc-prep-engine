import { NextRequest, NextResponse } from 'next/server';
import { getAPFCNodeByPath } from '@/lib/syllabus/apfc-syllabus';
import { getAIModelConfig } from '@/lib/ai/models';
import { getRelevantPYQsForTopic } from '@/lib/study/pyq-retriever';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slugs = [], modelId = 'lightning30b', step = 'full_lesson', followUpType, customQuestion } = body;

    const node = getAPFCNodeByPath(slugs);
    const targetTitle = node.subtopic?.title || node.topic?.title || node.section?.title || 'General APFC Syllabus';
    const targetOneLiner = node.subtopic?.oneLiner || node.topic?.oneLiner || node.section?.oneLiner || '';
    const keyConcepts = node.subtopic?.keyConcepts || [];
    const importantPoints = node.subtopic?.importantPoints || [];
    const pyqKeywords = node.subtopic?.pyqKeywords || node.topic?.slug.split('-') || [];
    const sectionName = node.section?.title || 'APFC Syllabus';

    // Retrieve small relevant subset of historical PYQs
    const pyqs = await getRelevantPYQsForTopic(pyqKeywords, node.section?.slug, 3);

    const modelConfig = getAIModelConfig(modelId);
    const nvidiaKey = process.env.NVIDIA_API_KEY_1;
    const geminiKey = process.env.GEMINI_API_KEY;

    const pyqContextStr = pyqs.length > 0
      ? pyqs.map((q, idx) => `[PYQ #${idx + 1} (${q.year} ${q.examStage})] Q: ${q.questionText} | Answer: ${q.correctAnswer} | Explanation: ${q.explanation || 'N/A'}`).join('\n\n')
      : 'No exact historical PYQs matched for this subtopic keywords.';

    const systemPrompt = `You are the lead AI Teacher for UPSC EPFO APFC & EO-AO Examination 2026.
Your mandate is to deliver a laser-focused, highly structured, APFC-calibrated lesson for the exact topic selected by the student.

TEACHING PHILOSOPHY & BOUNDARIES:
1. STRICT TOPIC BOUNDARY: Teach ONLY "${targetTitle}" under syllabus section "${sectionName}". Do NOT dump the whole subject or unrelated syllabus chapters.
2. NOT TOO MUCH: No textbook-length walls of text. No obscure university-level fluff.
3. NOT TOO LITTLE: Give complete explanations, exact definitions, key legal/accounting thresholds, practical examples, and common distractor traps.
4. 2026 GOVERNANCE RULE: If section is Governance, strictly cover ESG, Board Oversight, Internal Controls, Whistleblower Protections, Human Capital, and Board Diversity. Never substitute generic constitutional polity.
5. LEGAL & ACCOUNTING ACCURACY: Never invent Labour Code provisions, Accounting Standards (Ind AS), or Insurance principles. State facts with exact statutory references.

HISTORICAL PYQ CONTEXT (FOR EXPLAINING UPSC QUESTION PATTERNS):
${pyqContextStr}

REQUIRED LESSON STRUCTURE (STRICT JSON RESPONSE):
Return ONLY a valid JSON object matching this schema:
{
  "topicTitle": "${targetTitle}",
  "sectionName": "${sectionName}",
  "modelUsed": "${modelConfig.name}",
  "step1Overview": "Concise 2-3 sentence overview of what the student needs to know for APFC.",
  "step2CoreConcepts": [
    {
      "title": "Concept Title",
      "explanation": "Clear, precise explanation with relevant formulas, statutory sections, or rules.",
      "mustKnowVsNiceToKnow": "Must Know: ... | Nice to Know: ..."
    }
  ],
  "step3CommonTraps": [
    {
      "trap": "Common confusion point or distractor trap used by UPSC",
      "clarification": "Why it is wrong and how to avoid falling for it"
    }
  ],
  "step4PYQAnalysis": "Breakdown of how UPSC tests this topic based on historical PYQ patterns and question styles.",
  "step5PracticeQuestions": [
    {
      "questionText": "APFC-level MCQ question text",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why A is correct and why B, C, D are wrong."
    }
  ],
  "step6InteractiveFollowUps": [
    "Quick 5-min Revision Summary",
    "Generate 3 Harder Practice Questions",
    "Discuss PYQ Distractors in Depth",
    "Ask a Custom Follow-Up Question"
  ]
}`;

    const userPrompt = followUpType
      ? `The student requested follow-up action: "${followUpType}". Custom query: "${customQuestion || 'None'}". Provide updated guidance for "${targetTitle}".`
      : `Teach the APFC topic: "${targetTitle}". Core syllabus points to include: ${keyConcepts.join('; ')}.`;

    let lessonData: any = null;

    // 1. Try NVIDIA NIM API (Nemotron 3.5 Lightning 30B or 120B)
    if (nvidiaKey) {
      try {
        const payload = JSON.stringify({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 2500
        });

        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: payload
        });

        if (res.ok) {
          const json = await res.json();
          const rawContent = json.choices?.[0]?.message?.content;
          if (rawContent) {
            const match = rawContent.match(/\{[\s\S]*?\}/);
            if (match) {
              lessonData = JSON.parse(match[0]);
            }
          }
        }
      } catch (err) {
        console.warn('NVIDIA NIM call failed in teach route, trying Gemini fallback...', err);
      }
    }

    // 2. Fallback to Gemini 3.7/3.5 Flash if NVIDIA API is unavailable
    if (!lessonData && geminiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (res.ok) {
          const json = await res.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            lessonData = JSON.parse(rawText);
            lessonData.modelUsed = `${modelConfig.name} (Gemini Engine)`;
          }
        }
      } catch (err) {
        console.error('Gemini fallback in teach route failed:', err);
      }
    }

    if (!lessonData) {
      throw new Error('Failed to generate lesson from AI Teacher models. Please try again.');
    }

    return NextResponse.json({
      success: true,
      data: lessonData,
      pyqsUsed: pyqs
    });
  } catch (error: any) {
    console.error('Error in /api/study/teach:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error generating APFC lesson' },
      { status: 500 }
    );
  }
}
