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

    const systemPrompt = `You are an elite UPSC CSE mentor, evaluator, and syllabus architect.
Your task is to analyze this NCERT chapter thoroughly and generate rigorous, high-yield, exam-ready notes specifically calibrated for UPSC Civil Services Examination 2027.

CRITICAL INSTRUCTIONS:
1. DO NOT just write topic titles or state that a difference exists. You MUST explicitly provide the substantive explanation, comparative table/points, and the actual reasoning.
   - Example: Instead of "Difference between HDI and PCI", write: "HDI vs PCI: World Bank uses PCI (US$ per capita) which measures only monetary growth and masks severe intra-national inequality. UNDP's HDI is a composite geometric mean of 3 dimensions: Health (Life Expectancy at birth), Education (Mean years & Expected years of schooling), and Standard of Living (GNI per capita in PPP$). A state like Haryana has higher PCI but worse Infant Mortality (30) than Kerala (6), proving PCI fails to capture human welfare."
2. Extract exact NCERT data traps, comparative state/country statistics (e.g., Haryana vs Kerala vs Bihar on IMR/Literacy/Net Attendance), and core case studies (e.g., Narmada Dam displacement, Groundwater overexploitation in Punjab/Western UP).
3. Connect concepts to UPSC Mains enrichment: mention relevant NITI Aayog Reports/Indices (e.g., MPI, SDG Index), Constitutional Articles (e.g., Art 21, 38, 39, 47), and value-addition keywords.
4. For Map Work: identify exact geographic coordinates, river basins, mineral belts, archaeological sites, or ecological hotspots from this chapter to mark on India/World outline maps.
5. For Diagrams: specify precise models, flowcharts, or cycle diagrams to draw in 10/15-marker Mains answers.

Return ONLY a valid JSON object matching this schema:
{
  "relevance": "GS Paper & Primary Syllabus Module (e.g., GS-III: Indian Economy & Inclusive Growth | Prelims: Macroeconomics)",
  "highYieldSummary": [
    "3-5 dense, high-yield takeaway bullet points summarizing the core arguments"
  ],
  "prelimsFocus": [
    "4-6 exhaustive, conceptual and factual bullet points containing the COMPLETE explanation, specific definitions, and Prelims trap warnings"
  ],
  "mainsAngles": [
    "2-4 analytical questions with structured answer frameworks, keywords, and constitutional/policy linkages"
  ],
  "caseStudiesAndData": [
    "2-3 specific NCERT case studies, statistical tables, or real-world examples cited in the chapter"
  ],
  "keyDefinitions": [
    {
      "term": "Term Name (e.g., Infant Mortality Rate (IMR))",
      "definition": "Precise formula, criterion, and exam definition (e.g., Number of children that die before the age of 1 year per 1,000 live births in that particular year)."
    }
  ],
  "mapWork": [
    "2-4 specific geographic locations, archaeological sites, projects, or resource zones to plot on Atlas/Maps"
  ],
  "diagramsToDraw": [
    "1-3 exact diagrams, cycle flowcharts, or structural frameworks to draw in Mains answers"
  ]
}`;

    const userPrompt = `Analyze this NCERT chapter in full depth for UPSC CSE 2027:
- Subject: ${chapter.book.subject.name}
- Book: ${chapter.book.title} (Class ${chapter.book.className})
- Chapter ${chapter.number}: ${chapter.title}
- Complete Chapter Content: ${chapter.content || chapter.summary || ''}`;

    // Try primary high-intelligence models with automatic fallback
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];
    let parsedData = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
          systemInstruction: systemPrompt,
        });

        const aiRes = await model.generateContent(userPrompt);
        const jsonText = aiRes.response.text();
        parsedData = JSON.parse(jsonText);
        break; // Success!
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed or rate-limited, trying next fallback...`, err);
      }
    }

    if (!parsedData) {
      throw lastError || new Error('Failed to generate analysis across all models');
    }

    // Save permanently in the database under this chapter's record
    await prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        summary: JSON.stringify({
          highYieldSummary: parsedData.highYieldSummary || [],
          mainsAngles: parsedData.mainsAngles || [],
          caseStudiesAndData: parsedData.caseStudiesAndData || [],
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
