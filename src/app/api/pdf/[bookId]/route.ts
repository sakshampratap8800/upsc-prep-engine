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

    // Look in primary path or fallback relative to project root
    let targetPath = book.filePath;
    if (!targetPath || !fs.existsSync(targetPath)) {
      targetPath = path.resolve('E:/books', book.subject.slug, book.fileName);
    }
    if (!fs.existsSync(targetPath)) {
      targetPath = path.resolve(process.cwd(), '..', book.subject.slug, book.fileName);
    }

    if (!fs.existsSync(targetPath)) {
      return new NextResponse('PDF file not found on disk', { status: 404 });
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
