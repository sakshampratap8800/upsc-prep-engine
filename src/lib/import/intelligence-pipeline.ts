import prisma from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface MappingResult {
  chaptersProcessed: number;
  pyqsProcessed: number;
  chapterTopicLinks: number;
  chapterPyqLinks: number;
  pyqTopicLinks: number;
  errors: string[];
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
    systemInstruction: systemPrompt,
  });

  const response = await model.generateContent(userPrompt);
  return response.response.text();
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Phase 7a: Map chapters to syllabus topics using AI
 */
export async function mapChaptersToTopics(): Promise<MappingResult> {
  const result: MappingResult = {
    chaptersProcessed: 0,
    pyqsProcessed: 0,
    chapterTopicLinks: 0,
    chapterPyqLinks: 0,
    pyqTopicLinks: 0,
    errors: [],
  };

  // Load all syllabus topics
  const allTopics = await prisma.syllabusTopic.findMany({
    select: { id: true, name: true, paper: true },
  });

  const topicList = allTopics.map(t => `${t.id}: [${t.paper}] ${t.name}`).join('\n');

  // Load chapters that haven't been mapped yet
  const chapters = await prisma.chapter.findMany({
    where: { topics: { none: {} } },
    select: {
      id: true,
      number: true,
      title: true,
      summary: true,
      book: { select: { title: true, className: true, subject: { select: { name: true } } } },
    },
  });

  const SYSTEM_PROMPT = `You are a UPSC CSE exam expert. You will map NCERT textbook chapters to the official UPSC Civil Services syllabus topics.

RULES:
1. Only return topic IDs that exist in the provided list.
2. Return ONLY a JSON array of topic IDs, nothing else. Example: [502, 509, 511]
3. A chapter can map to 1-5 topics maximum.
4. Be precise - only map if the chapter content genuinely relates to the topic.
5. If no topics match, return an empty array: []`;

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    let retries = 3;
    while (retries > 0) {
      try {
        const userPrompt = `Map this NCERT chapter to the UPSC syllabus topics below.

CHAPTER:
- Subject: ${ch.book.subject.name}
- Book: ${ch.book.title} (Class ${ch.book.className})
- Chapter ${ch.number}: ${ch.title}
- Summary: ${(ch.summary || '').slice(0, 500)}

SYLLABUS TOPICS:
${topicList}

Return ONLY a JSON array of matching topic IDs.`;

        const response = await callGemini(SYSTEM_PROMPT, userPrompt);

        const jsonMatch = response.match(/\[[\d,\s]*\]/);
        if (jsonMatch) {
          const topicIds: number[] = JSON.parse(jsonMatch[0]);
          const validIds = topicIds.filter(id => allTopics.some(t => t.id === id));

          if (validIds.length > 0) {
            await prisma.chapter.update({
              where: { id: ch.id },
              data: {
                topics: {
                  connect: validIds.map(id => ({ id })),
                },
              },
            });
            result.chapterTopicLinks += validIds.length;
          }
        }

        result.chaptersProcessed++;
        await sleep(1000);
        break;
      } catch (error) {
        retries--;
        const msg = error instanceof Error ? error.message : String(error);
        if (retries === 0) {
          result.errors.push(`Chapter ${ch.id} (${ch.title}): ${msg}`);
        } else {
          await sleep(3000);
        }
      }
    }
  }

  return result;
}

/**
 * Phase 7b: Map PYQs to syllabus topics using AI
 */
export async function mapPYQsToTopics(): Promise<MappingResult> {
  const result: MappingResult = {
    chaptersProcessed: 0,
    pyqsProcessed: 0,
    chapterTopicLinks: 0,
    chapterPyqLinks: 0,
    pyqTopicLinks: 0,
    errors: [],
  };

  const allTopics = await prisma.syllabusTopic.findMany({
    select: { id: true, name: true, paper: true },
  });

  const topicList = allTopics.map(t => `${t.id}: [${t.paper}] ${t.name}`).join('\n');

  const BATCH_SIZE = 15;

  const SYSTEM_PROMPT = `You are a UPSC CSE exam expert. You will map Previous Year Questions to the UPSC syllabus topics.

RULES:
1. Only return topic IDs that exist in the provided list.
2. Return a JSON object mapping question IDs (as string keys) to arrays of topic IDs.
3. Example: {"123": [502, 509], "124": [530]}
4. Each question should map to 1-3 topics maximum.
5. Be precise - only map if the question genuinely tests knowledge of that topic.`;

  while (true) {
    const unmappedPYQs = await prisma.pYQ.findMany({
      where: { topics: { none: {} } },
      select: { id: true, year: true, examStage: true, paper: true, questionText: true },
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
    });

    if (unmappedPYQs.length === 0) break;

    let retries = 3;
    while (retries > 0) {
      try {
        const questionsText = unmappedPYQs.map(p =>
          `ID:${p.id} [${p.examStage} ${p.year} ${p.paper}]: ${p.questionText.slice(0, 300)}`
        ).join('\n\n');

        const userPrompt = `Map these UPSC PYQs to the syllabus topics below.

QUESTIONS:
${questionsText}

SYLLABUS TOPICS:
${topicList}

Return ONLY a JSON object mapping question IDs to arrays of topic IDs.`;

        const response = await callGemini(SYSTEM_PROMPT, userPrompt);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const mappings: Record<string, number[]> = JSON.parse(jsonMatch[0]);

          for (const [pyqIdStr, topicIds] of Object.entries(mappings)) {
            const pyqId = parseInt(pyqIdStr, 10);
            const validIds = topicIds.filter(id => allTopics.some(t => t.id === id));

            if (validIds.length > 0) {
              try {
                await prisma.pYQ.update({
                  where: { id: pyqId },
                  data: {
                    topics: {
                      connect: validIds.map(id => ({ id })),
                    },
                  },
                });
                result.pyqTopicLinks += validIds.length;
              } catch {
                // Ignore transient missing IDs
              }
            }
          }
        }

        result.pyqsProcessed += unmappedPYQs.length;
        await sleep(1000);
        break;
      } catch (error) {
        retries--;
        const msg = error instanceof Error ? error.message : String(error);
        if (retries === 0) {
          result.errors.push(`PYQ batch error: ${msg}`);
          // Fallback: connect to general topic for that paper if all retries fail
        } else {
          await sleep(4000);
        }
      }
    }
  }

  return result;
}

/**
 * Phase 7c: Map PYQs to chapters based on shared topics
 */
export async function mapPYQsToChapters(): Promise<MappingResult> {
  const result: MappingResult = {
    chaptersProcessed: 0,
    pyqsProcessed: 0,
    chapterTopicLinks: 0,
    chapterPyqLinks: 0,
    pyqTopicLinks: 0,
    errors: [],
  };

  // Find chapters that have topics
  const chapters = await prisma.chapter.findMany({
    where: { topics: { some: {} } },
    select: { id: true, topics: { select: { id: true } } },
  });

  for (const ch of chapters) {
    const topicIds = ch.topics.map(t => t.id);

    // Find PYQs that share any of these topics
    const relatedPYQs = await prisma.pYQ.findMany({
      where: { topics: { some: { id: { in: topicIds } } } },
      select: { id: true },
    });

    if (relatedPYQs.length > 0) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: {
          pyqs: {
            connect: relatedPYQs.map(p => ({ id: p.id })),
          },
        },
      });
      result.chapterPyqLinks += relatedPYQs.length;
    }

    result.chaptersProcessed++;
  }

  return result;
}
