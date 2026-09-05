import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    if (!fileName) return new NextResponse('Missing file name', { status: 400 });

    // Look directly inside your E:\books\images folder
    const targetPath = path.resolve('E:/books/images', fileName);

    if (!fs.existsSync(targetPath)) {
      // Also check pyqs subfolder if created
      const subPath = path.resolve('E:/books/images/pyqs', fileName);
      if (!fs.existsSync(subPath)) {
        return new NextResponse('Image not found in E:/books/images', { status: 404 });
      }
      const buffer = fs.readFileSync(subPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const buffer = fs.readFileSync(targetPath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Image Route error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
