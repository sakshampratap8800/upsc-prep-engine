import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { pyqId } = await req.json();
    if (!pyqId) return NextResponse.json({ success: false, error: 'pyqId required' }, { status: 400 });

    const pyq = await prisma.pYQ.findUnique({ where: { id: parseInt(pyqId, 10) } });
    if (!pyq) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });

    if (pyq.explanation) {
      return NextResponse.json({ success: true, explanation: pyq.explanation });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'No API key' }, { status: 500 });

    const options = JSON.parse(pyq.optionsJson || '[]');
    const prompt = `Explain this UPSC EPFO question accurately.\n\nQuestion: ${pyq.questionText}\n\nOptions: ${options.join(' | ')}\n\nCorrect Answer: ${pyq.correctAnswer}\n\nProvide a detailed, exam-focused explanation. Explain why the correct answer is correct, and briefly why the distractors are wrong. Keep it under 250 words.`;

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!res.ok) throw new Error('Explanation generation failed');
    const data = await res.json();
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Explanation not available.';

    await prisma.pYQ.update({
      where: { id: pyq.id },
      data: { explanation }
    });

    return NextResponse.json({ success: true, explanation });
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
