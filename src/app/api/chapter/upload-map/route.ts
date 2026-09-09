import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.cookies.get('upsc_admin_token')?.value;
    if (!verifyAuthToken(authToken)) {
      return NextResponse.json({ error: 'Unauthorized: Admin password required to upload maps' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    const chapterIdStr = formData.get('chapterId') as string | null;
    const filenamePrefix = formData.get('filenamePrefix') as string || 'map';

    if (!chapterIdStr) {
      return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });
    }

    const chapterId = parseInt(chapterIdStr, 10);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: { include: { subject: true } } }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const currentImages = chapter.mapImagesJson ? JSON.parse(chapter.mapImagesJson) : [];
    const { uploadImageToAzure } = await import('@/lib/azure-storage');

    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let ext = 'png';
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg';
      else if (file.type === 'image/webp') ext = 'webp';
      else if (file.type === 'image/svg+xml') ext = 'svg';

      const cleanSubject = chapter.book.subject.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileName = `ch_${chapterId}_${cleanSubject}_${filenamePrefix}_${timestamp}_${i}.${ext}`;

      let publicUrl = `/chapter-maps/${fileName}`;
      try {
        // 1. Primary: Upload directly to Azure Blob Storage (Student Pack Cloud Storage)
        const azureUrl = await uploadImageToAzure(fileName, buffer, file.type || 'image/png');
        if (azureUrl) {
          publicUrl = azureUrl;
        }
      } catch (azureErr) {
        console.warn('Azure upload failed, using local backup:', azureErr);
      }

      // Save local backups
      try {
        const fs = require('fs');
        const path = require('path');
        const booksImagesDir = path.resolve('E:/books/images/maps');
        if (fs.existsSync(path.resolve('E:/books'))) {
          if (!fs.existsSync(booksImagesDir)) fs.mkdirSync(booksImagesDir, { recursive: true });
          fs.writeFileSync(path.join(booksImagesDir, fileName), buffer);
        }
        const publicImagesDir = path.resolve(process.cwd(), 'public/chapter-maps');
        if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });
        fs.writeFileSync(path.join(publicImagesDir, fileName), buffer);
      } catch (localErr) {
        console.error('Local backup failed', localErr);
      }

      uploadedUrls.push(publicUrl);
      currentImages.push({
        url: publicUrl,
        title: filenamePrefix + (files.length > 1 ? ` ${i+1}` : ''),
        uploadedAt: new Date().toISOString()
      });
    }

    await prisma.chapter.update({
      where: { id: chapter.id },
      data: { mapImagesJson: JSON.stringify(currentImages) },
    });

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
