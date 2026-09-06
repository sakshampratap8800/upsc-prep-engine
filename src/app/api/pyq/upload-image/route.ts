import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.cookies.get('upsc_admin_token')?.value;
    if (!verifyAuthToken(authToken)) {
      return NextResponse.json({ error: 'Unauthorized: Admin password required to upload diagrams' }, { status: 401 });
    }

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

    // Clean naming: e.g. pyq_2014_prelims_paper_2_csat_q34.png
    const cleanPaper = pyq.paper.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();
    const cleanStage = pyq.examStage.toLowerCase();
    const qNum = pyq.questionNumber ? `q${pyq.questionNumber}` : `id${pyq.id}`;
    const fileName = `pyq_${pyq.year}_${cleanStage}_${cleanPaper}_${qNum}.${ext}`;

    // 1. Upload directly to Google Drive `images` folder (Cloud Storage)
    let publicUrl = `/pyq-images/${fileName}`;
    try {
      const { uploadImageToDrive } = await import('@/lib/gdrive');
      const driveUpload = await uploadImageToDrive(fileName, buffer, file.type || 'image/png');
      if (driveUpload && driveUpload.cdnUrl) {
        publicUrl = driveUpload.cdnUrl;
        console.log('Successfully uploaded diagram to Google Drive:', driveUpload.cdnUrl);
      }
    } catch (gdriveErr) {
      console.warn('Google Drive direct upload skipped or failed:', gdriveErr);
    }

    // 2. Save local backups if local folders exist
    try {
      const booksImagesDir = path.resolve('E:/books/images/pyqs');
      if (fs.existsSync(path.resolve('E:/books'))) {
        if (!fs.existsSync(booksImagesDir)) fs.mkdirSync(booksImagesDir, { recursive: true });
        fs.writeFileSync(path.join(booksImagesDir, fileName), buffer);
      }
      const publicImagesDir = path.resolve(process.cwd(), 'public/pyq-images');
      if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });
      fs.writeFileSync(path.join(publicImagesDir, fileName), buffer);
    } catch (localErr) {
      // Ignored on serverless Vercel
    }

    // Update database (use raw SQL update for 100% resilience across all client versions)
    const rangeStartStr = formData.get('rangeStart') as string | null;
    const rangeEndStr = formData.get('rangeEnd') as string | null;

    let updatedQuestionsCount = 1;

    try {
      await prisma.$executeRawUnsafe(`UPDATE pyqs SET imageUrl = ? WHERE id = ?`, publicUrl, pyqId);

      // If range is specified, apply to all questions in the exact same year, stage, and paper
      if (rangeStartStr && rangeEndStr) {
        const startQ = Math.min(parseInt(rangeStartStr, 10), parseInt(rangeEndStr, 10));
        const endQ = Math.max(parseInt(rangeStartStr, 10), parseInt(rangeEndStr, 10));
        
        if (!isNaN(startQ) && !isNaN(endQ)) {
          const res = await prisma.$executeRawUnsafe(
            `UPDATE pyqs 
             SET imageUrl = ? 
             WHERE year = ? 
               AND examStage = ? 
               AND (paper = ? OR paper LIKE '%' || ? || '%')
               AND questionNumber >= ? 
               AND questionNumber <= ?`,
            publicUrl,
            pyq.year,
            pyq.examStage,
            pyq.paper,
            pyq.paper.includes('CSAT') ? 'CSAT' : pyq.paper,
            startQ,
            endQ
          );
          updatedQuestionsCount = res;
        }
      }
    } catch (dbErr) {
      console.warn('executeRaw failed, falling back to prisma.pYQ.update:', dbErr);
      await prisma.pYQ.update({
        where: { id: pyqId },
        data: { imageUrl: publicUrl } as any,
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName,
      updatedCount: updatedQuestionsCount,
    });
  } catch (error: any) {
    console.error('Error uploading PYQ image:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
