import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { pyqId, userAnswer, timeTakenSeconds } = await req.json();

    if (!pyqId) {
      return NextResponse.json({ error: 'Missing pyqId' }, { status: 400 });
    }

    const pyq = await prisma.pYQ.findUnique({
      where: { id: pyqId },
    });

    if (!pyq) {
      return NextResponse.json({ error: 'PYQ not found' }, { status: 404 });
    }

    const options: string[] = pyq.optionsJson ? JSON.parse(pyq.optionsJson) : [];

    let correctAnswer = pyq.correctAnswer;
    let explanation = pyq.explanation;
    let optionBreakdown: Record<string, string> = {};

    const systemPrompt = `You are a Senior UPSC CSE Evaluator and Subject Matter Expert.
Analyze the following official UPSC question thoroughly.

Provide your response strictly in JSON format matching this schema:
{
  "correctAnswer": "A string representing the correct option label e.g., 'A', 'B', 'C', or 'D', or brief answer if descriptive",
  "explanation": "Clear, concise high-yield conceptual explanation directly citing relevant NCERT books, Constitutional articles, Supreme Court judgments, or government reports.",
  "optionBreakdown": {
    "A": "Why option A is correct or why it is incorrect / trap.",
    "B": "Why option B is correct or why it is incorrect / trap.",
    "C": "Why option C is correct or why it is incorrect / trap.",
    "D": "Why option D is correct or why it is incorrect / trap."
  },
  "subjectArea": "e.g., Polity, Modern History, Physical Geography, Macroeconomics, etc.",
  "difficulty": "Easy | Medium | Hard",
  "eliminationTrick": "A 1-sentence tip on how a smart UPSC aspirant could eliminate false options or identify clues in this question."
}`;

    const userPrompt = `Year: ${pyq.year}
Exam Stage: ${pyq.examStage}
Paper: ${pyq.paper}
Question:
${pyq.questionText}

${options.length > 0 ? `Options:\n${options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}` : ''}

${userAnswer ? `User selected answer: ${userAnswer}` : ''}`;

    let aiData: any = null;

    const geminiModels = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
    ];

    if (process.env.GEMINI_API_KEY) {
      for (const modelName of geminiModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
            systemInstruction: systemPrompt,
          });
          const res = await model.generateContent(userPrompt);
          const text = res.response.text()?.trim() || '';
          if (text) {
            aiData = JSON.parse(text);
            break;
          }
        } catch (e) {
          // Fallback to next model
        }
      }
    }

    // Fallback to Groq if Gemini hits quota
    if (!aiData && process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });
        const groqJson = await groqRes.json();
        const content = groqJson.choices?.[0]?.message?.content;
        if (content) {
          aiData = JSON.parse(content);
        }
      } catch (e) {
        console.warn('Groq fallback error:', e);
      }
    }

    if (aiData) {
      correctAnswer = aiData.correctAnswer || correctAnswer;
      explanation = aiData.explanation || explanation;
      optionBreakdown = aiData.optionBreakdown || {};

      await prisma.pYQ.update({
        where: { id: pyqId },
        data: {
          correctAnswer: correctAnswer || undefined,
          explanation: explanation || undefined,
          subjectArea: aiData.subjectArea || pyq.subjectArea || undefined,
          difficulty: aiData.difficulty || pyq.difficulty || undefined,
        },
      });
    }

    let isCorrect: boolean | null = null;
    let score: number | null = null;

    if (userAnswer && correctAnswer) {
      const cleanUser = userAnswer.trim().toUpperCase().replace(/[^A-D0-9]/g, '');
      const cleanCorrect = correctAnswer.trim().toUpperCase().replace(/[^A-D0-9]/g, '');
      
      isCorrect = cleanUser === cleanCorrect || 
                  cleanUser.startsWith(cleanCorrect) || 
                  cleanCorrect.startsWith(cleanUser) ||
                  userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      
      score = isCorrect ? 1 : 0;
    }

    let attemptId: number | null = null;
    if (userAnswer) {
      const attempt = await prisma.answerAttempt.create({
        data: {
          pyqId,
          userAnswer: String(userAnswer),
          score,
          feedback: isCorrect ? 'Correct!' : `Incorrect. Correct answer is ${correctAnswer}`,
          timeTakenSeconds: timeTakenSeconds || 0,
        },
      });
      attemptId = attempt.id;
    }

    return NextResponse.json({
      success: true,
      pyqId,
      userAnswer,
      correctAnswer,
      isCorrect,
      explanation,
      optionBreakdown,
      subjectArea: pyq.subjectArea || aiData?.subjectArea,
      difficulty: pyq.difficulty || aiData?.difficulty,
      eliminationTrick: aiData?.eliminationTrick,
      attemptId,
    });
  } catch (error: any) {
    console.error('Error in evaluate-pyq:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
