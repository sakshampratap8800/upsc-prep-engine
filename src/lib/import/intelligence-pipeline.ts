import prisma from '@/lib/db';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface MappingResult {
  chaptersProcessed: number;
  pyqsProcessed: number;
  chapterTopicLinks: number;
  chapterPyqLinks: number;
  pyqTopicLinks: number;
  errors: string[];
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Phase 7: Map chapters to syllabus topics using AI
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

  // Process chapters in batches to respect rate limits
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
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

      const response = await callGroq(SYSTEM_PROMPT, userPrompt);

      // Parse the JSON response
      const jsonMatch = response.match(/\[[\d,\s]*\]/);
      if (jsonMatch) {
        const topicIds: number[] = JSON.parse(jsonMatch[0]);
        const validIds = topicIds.filter(id => allTopics.some(t => t.id === id));

        // Create chapter-topic connections
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

      // Rate limit: ~30 req/min for Groq free tier
      if (i % 25 === 24) {
        await sleep(60000); // Wait 1 minute every 25 requests
      } else {
        await sleep(2500); // 2.5s between requests
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Chapter ${ch.id} (${ch.title}): ${msg}`);
      // If rate limited, wait longer
      if (msg.includes('429')) {
        await sleep(60000);
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

  // Load PYQs in batches of 10
  const totalPYQs = await prisma.pYQ.count();
  const BATCH_SIZE = 10;

  const SYSTEM_PROMPT = `You are a UPSC CSE exam expert. You will map Previous Year Questions to the UPSC syllabus topics.

RULES:
1. Only return topic IDs that exist in the provided list.
2. Return a JSON object mapping question IDs to arrays of topic IDs.
3. Example: {"123": [502, 509], "124": [530]}
4. Each question should map to 1-3 topics maximum.
5. Be precise - only map if the question genuinely tests knowledge of that topic.`;

  for (let skip = 0; skip < totalPYQs; skip += BATCH_SIZE) {
    try {
      const pyqs = await prisma.pYQ.findMany({
        where: { topics: { none: {} } },
        select: { id: true, year: true, examStage: true, paper: true, questionText: true },
        skip,
        take: BATCH_SIZE,
        orderBy: { id: 'asc' },
      });

      if (pyqs.length === 0) break;

      const questionsText = pyqs.map(p =>
        `ID:${p.id} [${p.examStage} ${p.year} ${p.paper}]: ${p.questionText.slice(0, 300)}`
      ).join('\n\n');

      const userPrompt = `Map these UPSC PYQs to the syllabus topics below.

QUESTIONS:
${questionsText}

SYLLABUS TOPICS:
${topicList}

Return ONLY a JSON object mapping question IDs to arrays of topic IDs.`;

      const response = await callGroq(SYSTEM_PROMPT, userPrompt);

      // Parse response
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
              // PYQ ID might not exist
            }
          }
        }
      }

      result.pyqsProcessed += pyqs.length;

      // Rate limit
      if ((skip / BATCH_SIZE) % 25 === 24) {
        await sleep(60000);
      } else {
        await sleep(2500);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`PYQ batch at offset ${skip}: ${msg}`);
      if (msg.includes('429')) {
        await sleep(60000);
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
