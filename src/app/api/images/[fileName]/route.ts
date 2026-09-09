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
      // Check pyqs or maps subfolders
      const pyqPath = path.resolve('E:/books/images/pyqs', fileName);
      const mapPath = path.resolve('E:/books/images/maps', fileName);
      
      let filePath = '';
      if (fs.existsSync(pyqPath)) filePath = pyqPath;
      else if (fs.existsSync(mapPath)) filePath = mapPath;
      else {
        return new NextResponse('Image not found in E:/books/images', { status: 404 });
      }

      const buffer = fs.readFileSync(filePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' : 'image/png',
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
