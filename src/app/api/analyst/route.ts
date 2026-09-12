import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const pdfs = await prisma.analystPdf.findMany({
      orderBy: {
        date: 'desc',
      },
    });
    return NextResponse.json({ success: true, pdfs });
  } catch (error: any) {
    console.error("API analyst error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
