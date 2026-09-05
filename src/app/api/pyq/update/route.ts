import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, questionText, options, correctAnswer, explanation, difficulty, subjectArea, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing PYQ id' }, { status: 400 });
    }

    const updated = await prisma.pYQ.update({
      where: { id: Number(id) },
      data: {
        questionText: questionText !== undefined ? questionText.trim() : undefined,
        optionsJson: options !== undefined ? JSON.stringify(options) : undefined,
        correctAnswer: correctAnswer !== undefined ? (correctAnswer ? correctAnswer.trim().toUpperCase() : null) : undefined,
        explanation: explanation !== undefined ? explanation : undefined,
        difficulty: difficulty !== undefined ? difficulty : undefined,
        subjectArea: subjectArea !== undefined ? subjectArea : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
      },
    });

    return NextResponse.json({ success: true, pyq: updated });
  } catch (error: any) {
    console.error('Error updating PYQ:', error);
    return NextResponse.json({ error: error.message || 'Failed to update PYQ' }, { status: 500 });
  }
}
