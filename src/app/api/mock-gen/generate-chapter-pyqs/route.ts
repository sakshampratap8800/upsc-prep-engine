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

    // Azure Queue requires base64 encoded strings
    const payload = JSON.stringify({ chapterId: parseInt(chapterId, 10), task: 'generate_pyqs' });
    const message = Buffer.from(payload).toString('base64');
    
    await queueClient.sendMessage(message);

    return NextResponse.json({ success: true, message: 'NVIDIA generation task queued to Azure successfully' });
  } catch (error) {
    console.error('Queue Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to queue task' }, { status: 500 });
  }
}
