import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAIModelConfig } from '@/lib/ai/models';

export async function POST(req: NextRequest) {
  try {
    const { chapterId } = await req.json();

    if (!chapterId) {
      return NextResponse.json({ success: false, error: 'Chapter ID required' }, { status: 400 });
    }

    // 1. Fetch Chapter Data + Existing Real PYQs + Syllabus Topics
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId, 10) },
      include: {
        topics: true,
        pyqs: {
          where: { isAiGenerated: false },
          take: 10, // Use max 10 real PYQs for context
        },
      }
    });

    if (!chapter) {
      return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
    }

    if (!chapter.summary && !chapter.keyConceptsJson && !chapter.definitionsJson) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chapter needs Gemini Analysis first. Please run "Analyze with Gemini" before generating AI Practice Questions.' 
      }, { status: 400 });
    }

    const topicsString = chapter.topics.map((t: any) => t.name).join(', ');
    let pyqContext = '';
    if (chapter.pyqs.length > 0) {
      pyqContext = 'REAL UPSC PYQ REFERENCE (Match this style, complexity, and difficulty):\n' + 
        chapter.pyqs.map((q: any, i: number) => `Q${i+1}: ${q.questionText}\nAns: ${q.correctAnswer}\nType: ${q.questionType || 'MCQ'}`).join('\n\n');
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY_1 || process.env.NVIDIA_API_KEY_2;
    if (!nvidiaKey) {
      throw new Error('NVIDIA API Key not configured');
    }

    const modelName = 'nvidia/nemotron-3-super-120b-a12b'; // Deep Reasoning 120B

    // STEP 1: Generate Candidates
    const genPrompt = `You are an elite UPSC CSE paper setter. Your task is to generate 25 highly challenging, UPSC-level practice questions based EXACTLY on the knowledge provided below.

KNOWLEDGE BASE:
Topics: ${topicsString}
Chapter Summary: ${chapter.summary}
Key Concepts: ${chapter.keyConceptsJson}
Definitions: ${chapter.definitionsJson}

${pyqContext}

INSTRUCTIONS:
1. Generate 25 candidate questions.
2. Ensure questions match the UPSC Prelims style (Multi-statement, Assertion-Reasoning, elimination).
3. Do NOT invent facts outside the provided Knowledge Base.
4. Return ONLY a valid JSON array of objects.

JSON SCHEMA:
[
  {
    "questionText": "Question text...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A",
    "explanation": "Detailed reason why A is correct."
  }
]`;

    const genRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: genPrompt }],
        temperature: 0.3,
        max_tokens: 3500
      })
    });

    if (!genRes.ok) throw new Error('NVIDIA generation API failed');
    const genJson = await genRes.json();
    const genContent = genJson.choices?.[0]?.message?.content;
    let candidates = [];
    
    try {
      const match = genContent.match(/\[[\s\S]*\]/);
      candidates = JSON.parse(match ? match[0] : genContent);
    } catch (e) {
      throw new Error('Failed to parse generation JSON');
    }

    // STEP 2: Validate and Select Best 20
    const valPrompt = `You are a strict UPSC question-quality evaluator. I will give you a list of candidate questions.
Your task is to REJECT questions that are factually questionable, ambiguous, too trivial, or do not have a uniquely defensible answer.
Select the BEST 20 questions and return them as a valid JSON array.

CANDIDATES:
${JSON.stringify(candidates)}

RETURN STRICTLY JSON MATCHING:
[
  {
    "questionText": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "...",
    "explanation": "..."
  }
]`;

    const valRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: valPrompt }],
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!valRes.ok) throw new Error('NVIDIA validation API failed');
    const valJson = await valRes.json();
    const valContent = valJson.choices?.[0]?.message?.content;
    let finalQuestions = [];

    try {
      const match = valContent.match(/\[[\s\S]*\]/);
      finalQuestions = JSON.parse(match ? match[0] : valContent);
    } catch (e) {
      // Fallback: If validation parsing fails, just slice the candidates
      finalQuestions = candidates.slice(0, 20);
    }

    // Ensure we don't save more than 20
    finalQuestions = finalQuestions.slice(0, 20);

    // Save to Database
    const savedPyqs = await Promise.all(
      finalQuestions.map((q: any, i: number) => 
        prisma.pYQ.create({
          data: {
            year: new Date().getFullYear(),
            examStage: 'Prelims',
            paper: 'GS',
            questionNumber: i + 1,
            questionText: q.questionText,
            optionsJson: JSON.stringify(q.options || []),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: 'Medium',
            questionType: 'MCQ',
            sourceFile: 'AI Generator',
            isAiGenerated: true,
            aiModel: modelName,
            chapters: { connect: { id: chapter.id } }
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: savedPyqs.length });
  } catch (error) {
    console.error('AI Practice Gen Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
