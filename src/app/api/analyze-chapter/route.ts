import { NextRequest, NextResponse } from 'next/server';
import { QueueClient } from '@azure/storage-queue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chapterId = body.chapterId || body.id; // Support both

    if (!chapterId) {
      return NextResponse.json({ success: false, error: 'Chapter ID required' }, { status: 400 });
    }

    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING not set');

    const queueClient = new QueueClient(connStr, 'ai-tasks-queue');
    await queueClient.createIfNotExists();

    // Mark as processing immediately in DB
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.chapter.update({
      where: { id: parseInt(chapterId, 10) },
      data: { analyzeStatus: 'processing', analyzeError: null }
    });

    // Azure Queue requires base64 encoded strings
    const payload = JSON.stringify({ chapterId: parseInt(chapterId, 10), task: 'analyze_chapter' });
    const message = Buffer.from(payload).toString('base64');
    
    await queueClient.sendMessage(message);

    return NextResponse.json({ success: true, message: 'Analysis task queued to Azure successfully' });
  } catch (error) {
    console.error('Queue Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to queue task' }, { status: 500 });
  }
}
