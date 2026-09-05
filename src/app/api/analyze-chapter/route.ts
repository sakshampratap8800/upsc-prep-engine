import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterId } = body;

    if (!chapterId) {
      return NextResponse.json({ success: false, error: 'Chapter ID required' }, { status: 400 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId, 10) },
      include: {
        book: { include: { subject: true } },
        topics: true,
      }
    });

    if (!chapter) {
      return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
    }

    const systemPrompt = `You are an expert UPSC CSE mentor & syllabus architect.
Your task is to analyze NCERT textbook chapters and generate high-yield, exam-aligned preparation notes strictly targeted for UPSC 2027.

Return a valid JSON object with:
{
  "relevance": "GS-I / GS-II / GS-III / GS-IV / Prelims",
  "prelimsFocus": [
    "3-5 high-yield factual or conceptual points tested in Prelims"
  ],
  "mainsAngles": [
    "2-3 analytical questions, dimensions, or critical perspectives for Mains"
  ],
  "keyDefinitions": [
    { "term": "Term Name", "definition": "Precise NCERT & UPSC exam definition" }
  ],
  "highYieldSummary": [
    "3-5 dense, concise takeaway bullet points"
  ],
  "mapWork": [
    "2-4 specific geographic locations, historical sites, river passes, mineral belts, biosphere reserves, or atlas coordinates to locate and mark on India/World maps for UPSC"
  ],
  "diagramsToDraw": [
    "1-3 essential flowcharts, models, or conceptual diagrams to practice for Mains answer writing"
  ]
}`;

    const userPrompt = `Analyze this chapter for UPSC CSE:
- Subject: ${chapter.book.subject.name}
- Book: ${chapter.book.title} (Class ${chapter.book.className})
- Chapter ${chapter.number}: ${chapter.title}
- Content Excerpt: ${(chapter.content || chapter.summary || '').slice(0, 10000)}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
      systemInstruction: systemPrompt,
    });

    const aiRes = await model.generateContent(userPrompt);
    const jsonText = aiRes.response.text();
    const parsedData = JSON.parse(jsonText);

    // Save permanently in the database under this chapter's record
    await prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        summary: JSON.stringify({
          highYieldSummary: parsedData.highYieldSummary || [],
          mainsAngles: parsedData.mainsAngles || [],
          mapWork: parsedData.mapWork || [],
          diagramsToDraw: parsedData.diagramsToDraw || [],
          relevance: parsedData.relevance || 'GS / Prelims'
        }),
        definitionsJson: JSON.stringify(parsedData.keyDefinitions || []),
        keyConceptsJson: JSON.stringify(parsedData.prelimsFocus || []),
      }
    });

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error generating UPSC summary';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
