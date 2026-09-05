import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pyqIdStr = formData.get('pyqId') as string | null;

    if (!pyqIdStr) {
      return NextResponse.json({ error: 'Missing pyqId' }, { status: 400 });
    }

    const pyqId = parseInt(pyqIdStr, 10);
    const pyq = await prisma.pYQ.findUnique({
      where: { id: pyqId },
    });

    if (!pyq) {
      return NextResponse.json({ error: 'PYQ not found' }, { status: 404 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension
    let ext = 'png';
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg';
    else if (file.type === 'image/webp') ext = 'webp';
    else if (file.type === 'image/svg+xml') ext = 'svg';

    const cleanPaper = pyq.paper.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanStage = pyq.examStage.toLowerCase();
    const qNum = pyq.questionNumber ? `q${pyq.questionNumber}` : `id${pyq.id}`;
    const fileName = `pyq_${pyq.year}_${cleanStage}_${cleanPaper}_${qNum}_${Date.now()}.${ext}`;

    // Target directories:
    // 1. User's designated drive folder: E:\books\images\pyqs\
    const booksImagesDir = path.resolve('E:/books/images/pyqs');
    if (!fs.existsSync(booksImagesDir)) {
      fs.mkdirSync(booksImagesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(booksImagesDir, fileName), buffer);

    // 2. Next.js public directory for immediate serving: e:\books\upsc-app\public\pyq-images\
    const publicImagesDir = path.resolve(process.cwd(), 'public/pyq-images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicImagesDir, fileName), buffer);

    const publicUrl = `/pyq-images/${fileName}`;

    // Update database
    const updated = await prisma.pYQ.update({
      where: { id: pyqId },
      data: { imageUrl: publicUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName,
      pyq: updated,
    });
  } catch (error: any) {
    console.error('Error uploading PYQ image:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
