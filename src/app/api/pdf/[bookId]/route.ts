import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const id = parseInt(bookId, 10);
    if (isNaN(id)) return new NextResponse('Invalid ID', { status: 400 });

    const book = await prisma.book.findUnique({
      where: { id },
      include: { subject: true },
    });
    if (!book) return new NextResponse('Book not found', { status: 404 });

    // Look in:
    // 1. Next.js public/books directory (bundled inside app)
    // 2. Original recorded file path
    // 3. E:/books/<subject>/<fileName>
    let targetPath = path.resolve(process.cwd(), 'public/books', book.fileName);
    if (!fs.existsSync(targetPath) && book.filePath && fs.existsSync(book.filePath)) {
      targetPath = book.filePath;
    }
    if (!fs.existsSync(targetPath)) {
      targetPath = path.resolve('E:/books', book.subject.slug, book.fileName);
    }
    if (!fs.existsSync(targetPath)) {
      targetPath = path.resolve(process.cwd(), '..', book.subject.slug, book.fileName);
    }

    if (!fs.existsSync(targetPath)) {
      // Fallback for Vercel / Cloud deployments: Redirect to exact Google Drive Book
      const { getBookDriveInfo } = await import('@/lib/gdrive-map');
      const driveInfo = getBookDriveInfo(book.fileName);
      const targetUrl = driveInfo?.previewUrl || driveInfo?.viewUrl || 'https://drive.google.com/drive/folders/1WM938D-obvqcgG1ubET5YfV6JWj58ZxJ?usp=sharing';
      return NextResponse.redirect(targetUrl, 307);
    }

    const stat = fs.statSync(targetPath);
    const fileBuffer = fs.readFileSync(targetPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(targetPath)}"`,
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('PDF Route error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
