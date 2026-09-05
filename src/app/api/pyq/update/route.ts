import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      questionText, 
      options, 
      correctAnswer, 
      explanation, 
      difficulty, 
      subjectArea, 
      imageUrl,
      passageText,
      applyPassageToRange, // e.g. { startQ: 20, endQ: 25 }
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing PYQ id' }, { status: 400 });
    }

    const currentPyq = await prisma.pYQ.findUnique({
      where: { id: Number(id) },
    });

    if (!currentPyq) {
      return NextResponse.json({ error: 'PYQ not found' }, { status: 404 });
    }

    // Direct SQL update on the current question to be 100% reliable
    if (questionText !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET questionText = ? WHERE id = ?`, questionText.trim(), Number(id));
    }
    if (options !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET optionsJson = ? WHERE id = ?`, JSON.stringify(options), Number(id));
    }
    if (correctAnswer !== undefined) {
      const cleanAns = correctAnswer ? correctAnswer.trim().toUpperCase() : null;
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET correctAnswer = ? WHERE id = ?`, cleanAns, Number(id));
    }
    if (explanation !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET explanation = ? WHERE id = ?`, explanation, Number(id));
    }
    if (difficulty !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET difficulty = ? WHERE id = ?`, difficulty, Number(id));
    }
    if (subjectArea !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET subjectArea = ? WHERE id = ?`, subjectArea, Number(id));
    }
    if (imageUrl !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET imageUrl = ? WHERE id = ?`, imageUrl, Number(id));
    }
    if (passageText !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET passageText = ? WHERE id = ?`, passageText ? passageText.trim() : null, Number(id));
    }

    // If a range is specified, strictly update matching questions in the SAME year, stage, and paper
    if (passageText !== undefined && applyPassageToRange && typeof applyPassageToRange.startQ === 'number' && typeof applyPassageToRange.endQ === 'number') {
      const startQ = Math.min(applyPassageToRange.startQ, applyPassageToRange.endQ);
      const endQ = Math.max(applyPassageToRange.startQ, applyPassageToRange.endQ);
      const cleanPassage = passageText ? passageText.trim() : null;

      await prisma.$executeRawUnsafe(
        `UPDATE pyqs 
         SET passageText = ? 
         WHERE year = ? 
           AND examStage = ? 
           AND paper = ? 
           AND questionNumber >= ? 
           AND questionNumber <= ?`,
        cleanPassage,
        currentPyq.year,
        currentPyq.examStage,
        currentPyq.paper,
        startQ,
        endQ
      );
    }

    const updated = await prisma.pYQ.findUnique({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, pyq: updated });
  } catch (error: any) {
    console.error('Error updating PYQ:', error);
    return NextResponse.json({ error: error.message || 'Failed to update PYQ' }, { status: 500 });
  }
}
