import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;
    const id = parseInt(bookId, 10);
    if (isNaN(id)) return new NextResponse('Invalid ID', { status: 400 });

    const book = await prisma.book.findUnique({ where: { id }, include: { subject: true } });
    if (!book) return new NextResponse('Not found', { status: 404 });

    let filePath = book.filePath;
    if (!filePath || !fs.existsSync(filePath)) {
      filePath = path.resolve(process.cwd(), '..', book.subject.slug, book.fileName);
    }

    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
    }

    return new NextResponse('PDF file not found', { status: 404 });
  } catch (err) {
    return new NextResponse('Error serving PDF', { status: 500 });
  }
}
